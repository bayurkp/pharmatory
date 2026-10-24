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
    activePreset: 'ambient',
    lastEvaluatedSummary: '',
    isDirty: false,
    showRawJson: false,

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
    debounceTimer: null,
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
      // Initial fulfillment evaluation so the page immediately displays live results
      await this.submitFulfillment()
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
          if (this.result) {
            await this.submitFulfillment()
          }
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
          if (this.result) {
            await this.submitFulfillment()
          }
        }
      } catch (err) {
        this.uploadErrorMessage = err.message || 'Reset failed.'
      } finally {
        this.uploadLoading = false
      }
    },

    // ─── Order & Simulator Management ───────────────────────────

    getProduct(id) {
      return this.products.find((p) => p.id === id) || null
    },

    isProductSelected(productId, currentIndex) {
      return this.orderItems.some(
        (item, idx) => idx !== currentIndex && item.productId === productId
      )
    },

    getTotalStock(productId) {
      const product = this.getProduct(productId)
      if (!product || !this.warehouses.length) return 0

      // For cold chain vaccines, count only warehouses with active refrigerated fleet (W04, W07, W08)
      const qualifiedWh = product.coldChainRequired
        ? this.warehouses.filter((w) => w.fullColdChainCapable)
        : this.warehouses

      return qualifiedWh.reduce((sum, w) => sum + (w.stocks?.[productId] || 0), 0)
    },

    adjustAllToMaxStock() {
      for (const item of this.orderItems) {
        const max = this.getTotalStock(item.productId)
        if (max > 0) {
          item.quantity = max
        }
      }
      this.onOrderChange(true)
    },

    onOrderChange(immediate = false) {
      this.activePreset = null
      this.isDirty = true

      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer)
        this.debounceTimer = null
      }

      if (immediate) {
        this.submitFulfillment()
        return
      }

      this.debounceTimer = setTimeout(() => {
        this.submitFulfillment()
      }, 350)
    },

    addOrderItem() {
      // Find the first product that has not yet been added to orderItems
      const unselected = this.products.find(
        (p) => !this.orderItems.some((item) => item.productId === p.id)
      )
      if (!unselected) {
        return
      }
      this.orderItems.push({ productId: unselected.id, quantity: 20 })
      this.onOrderChange(true)
    },

    removeOrderItem(index) {
      if (this.orderItems.length > 1) {
        this.orderItems.splice(index, 1)
        this.onOrderChange(true)
      }
    },

    async loadPreset(type) {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer)
        this.debounceTimer = null
      }
      this.activePreset = type
      const preset = ORDER_PRESETS[type]
      if (preset) {
        this.orderItems = preset.items.map((item) => ({ ...item }))
        this.orderTime = preset.time
      }
      this.isDirty = false
      await this.submitFulfillment()
    },

    async submitFulfillment() {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer)
        this.debounceTimer = null
      }

      // Guard against transient invalid quantities during typing
      const hasInvalidItem = this.orderItems.some(
        (it) =>
          !it.productId || it.quantity === '' || it.quantity <= 0 || isNaN(Number(it.quantity))
      )
      if (hasInvalidItem) {
        return
      }

      this.loading = true
      this.error = null

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
          this.isDirty = false

          // Generate human readable summary of evaluated order
          const summaryParts = this.orderItems.map((it) => {
            const p = this.products.find((prod) => prod.id === it.productId)
            const label = p ? p.name.split(' (')[0] : it.productId
            return `${it.quantity}x ${label}`
          })
          this.lastEvaluatedSummary = `${summaryParts.join(' + ')} · ${this.orderTime}`
        } else {
          this.error = json.error
          this.result = null
        }
      } catch (err) {
        this.error = { message: err.message || 'Fulfillment request failed.' }
        this.result = null
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
