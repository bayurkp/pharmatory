/**
 * Pharmatory Web Client
 * Modular Alpine.js Application Component
 */

/**
 * Pre-configured order presets for quick testing and demonstration
 */
const ORDER_PRESETS = {
  ambient: {
    items: [
      { productId: 'P001', quantity: 50 },
      { productId: 'P003', quantity: 100 }
    ],
    time: 'Mon, 14:00'
  },
  vaccine: {
    items: [{ productId: 'P002', quantity: 20 }],
    time: 'Mon, 08:00'
  },
  split: {
    items: [
      { productId: 'P001', quantity: 150 },
      { productId: 'P002', quantity: 25 },
      { productId: 'P004', quantity: 15 }
    ],
    time: 'Fri, 17:00'
  }
}

/**
 * Main application component definition for Alpine.js
 */
function createPharmatoryComponent() {
  return {
    activeTab: 'simulator',
    products: [],
    warehouses: [],
    trafficSummary: [],
    trafficRecords: [],
    orderItems: [
      { productId: 'P001', quantity: 50 },
      { productId: 'P003', quantity: 100 }
    ],
    orderTime: 'Mon, 14:00',
    loading: false,
    result: null,
    meta: null,
    error: null,

    // Custom CSV Upload state
    selectedFile: null,
    uploadLoading: false,
    uploadSuccessMessage: null,
    uploadErrorMessage: null,

    async init() {
      await Promise.all([this.fetchProducts(), this.fetchWarehouses(), this.fetchTraffic()])
    },

    // ─── Data Fetching ──────────────────────────────────────────

    async fetchProducts() {
      try {
        const res = await fetch('/api/v1/products')
        const json = await res.json()
        if (json.success) {
          this.products = json.data
        }
      } catch (err) {
        console.error('Failed to load products:', err)
      }
    },

    async fetchWarehouses() {
      try {
        const res = await fetch('/api/v1/warehouses')
        const json = await res.json()
        if (json.success) {
          this.warehouses = json.data
        }
      } catch (err) {
        console.error('Failed to load warehouses:', err)
      }
    },

    async fetchTraffic() {
      try {
        const res = await fetch('/api/v1/traffic/patterns')
        const json = await res.json()
        if (json.success) {
          this.trafficSummary = json.data.summary
          this.trafficRecords = json.data.records
        }
      } catch (err) {
        console.error('Failed to load traffic patterns:', err)
      }
    },

    // ─── Traffic CSV Management ─────────────────────────────────

    handleFileChange(event) {
      const files = event.target.files
      if (files && files.length > 0) {
        this.selectedFile = files[0]
        this.uploadSuccessMessage = null
        this.uploadErrorMessage = null
      }
    },

    async uploadCsv() {
      if (!this.selectedFile) return
      this.uploadLoading = true
      this.uploadSuccessMessage = null
      this.uploadErrorMessage = null

      try {
        const formData = new FormData()
        formData.append('file', this.selectedFile)

        const res = await fetch('/api/v1/traffic/upload', {
          method: 'POST',
          body: formData
        })

        const json = await res.json()
        if (json.success) {
          this.uploadSuccessMessage = `Parsed ${json.data.processedRecords} records from '${json.data.filename}' into memory.`
          await this.fetchTraffic()
        } else {
          this.uploadErrorMessage = json.error?.message || 'Upload failed.'
        }
      } catch (err) {
        this.uploadErrorMessage = err.message || 'Network error during upload.'
      } finally {
        this.uploadLoading = false
      }
    },

    async resetTraffic() {
      this.uploadLoading = true
      this.uploadSuccessMessage = null
      this.uploadErrorMessage = null

      try {
        const res = await fetch('/api/v1/traffic/reset', { method: 'POST' })
        const json = await res.json()
        if (json.success) {
          this.uploadSuccessMessage = 'Traffic model reset to benchmark dataset.'
          await this.fetchTraffic()
        }
      } catch (err) {
        this.uploadErrorMessage = err.message || 'Reset failed.'
      } finally {
        this.uploadLoading = false
      }
    },

    // ─── Order & Simulator Management ───────────────────────────

    addOrderItem() {
      const firstProd = this.products[0]?.id || 'P001'
      this.orderItems.push({ productId: firstProd, quantity: 20 })
    },

    removeOrderItem(index) {
      if (this.orderItems.length > 1) {
        this.orderItems.splice(index, 1)
      }
    },

    loadPreset(type) {
      const preset = ORDER_PRESETS[type]
      if (preset) {
        this.orderItems = preset.items.map((item) => ({ ...item }))
        this.orderTime = preset.time
      }
      this.result = null
      this.error = null
    },

    async submitFulfillment() {
      this.loading = true
      this.error = null
      this.result = null

      try {
        const payload = {
          items: this.orderItems.map((it) => ({
            productId: it.productId,
            quantity: Number(it.quantity)
          })),
          orderTime: this.orderTime
        }

        const res = await fetch('/api/v1/orders/fulfill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        const json = await res.json()

        if (json.success) {
          this.result = json.data
          this.meta = json.meta
        } else {
          this.error = json.error
        }
      } catch (err) {
        this.error = { message: err.message || 'Fulfillment request failed.' }
      } finally {
        this.loading = false
      }
    }
  }
}

// Register with Alpine.js
document.addEventListener('alpine:init', () => {
  window.Alpine.data('pharmatoryApp', createPharmatoryComponent)
})

// Fallback for direct invocation
window.pharmatoryApp = createPharmatoryComponent
