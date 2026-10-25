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
    rawResponse: null,

    products: [],
    warehouses: [],
    trafficSummary: [],
    trafficRecords: [],

    orderItems: [
      { productId: 'P001', quantity: 50 },
      { productId: 'P003', quantity: 100 }
    ],
    selectedDay: 'Mon',
    selectedTime: '14:00',
    orderTime: 'Mon, 14:00',
    daysList: [
      { code: 'Mon', label: 'Monday' },
      { code: 'Tue', label: 'Tuesday' },
      { code: 'Wed', label: 'Wednesday' },
      { code: 'Thu', label: 'Thursday' },
      { code: 'Fri', label: 'Friday' },
      { code: 'Sat', label: 'Saturday' },
      { code: 'Sun', label: 'Sunday' }
    ],

    getDayLabel(code) {
      const d = this.daysList.find((item) => item.code === code)
      return d ? d.label : code
    },
    timeSlots: (function () {
      const slots = []
      for (let h = 0; h < 24; h++) {
        for (const m of ['00', '30']) {
          const hh = String(h).padStart(2, '0')
          const val = `${hh}:${m}`
          let tag = ''
          if (val === '08:00' || val === '08:30') tag = ' · Morning Rush'
          else if (val === '14:00') tag = ' · Off-Peak'
          else if (val === '17:00' || val === '17:30') tag = ' · Evening Rush'
          slots.push({ value: val, label: `${val}${tag}` })
        }
      }
      return slots
    })(),
    timepicker: null,
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

    // Warehouse Directory Filters & Raw Payload
    warehouseSearch: '',
    warehouseCities: [],
    warehouseDistanceRange: '',
    warehouseColdChainFilter: '',
    showRawWarehousesJson: false,
    rawWarehousesResponse: null,

    warehouseCityList: ['Surabaya', 'Sidoarjo', 'Gresik', 'Pasuruan', 'Malang', 'Jember'],
    getWarehouseCityLabel() {
      if (this.warehouseCities.length === 0) return 'All Cities'
      if (this.warehouseCities.length === 1) return this.warehouseCities[0]
      return `${this.warehouseCities.length} Cities`
    },
    toggleWarehouseCity(city) {
      const idx = this.warehouseCities.indexOf(city)
      if (idx >= 0) {
        this.warehouseCities.splice(idx, 1)
      } else {
        this.warehouseCities.push(city)
      }
      this.onWarehouseFilterChange(true)
    },
    selectAllCities() {
      this.warehouseCities = [...this.warehouseCityList]
      this.onWarehouseFilterChange(true)
    },
    clearAllCities() {
      this.warehouseCities = []
      this.onWarehouseFilterChange(true)
    },

    warehouseDistanceOptions: [
      { value: '', label: 'All Distances' },
      { value: '30', label: 'Radius ≤ 30 km' },
      { value: '50', label: 'Radius ≤ 50 km' },
      { value: '100', label: 'Radius ≤ 100 km' }
    ],
    getWarehouseDistanceLabel() {
      const opt = this.warehouseDistanceOptions.find((o) => o.value === this.warehouseDistanceRange)
      return opt ? opt.label : 'All Distances'
    },

    warehouseFleetOptions: [
      { value: '', label: 'All Fleets' },
      { value: 'true', label: 'Refrigerated Vans Only' },
      { value: 'false', label: 'Standard Fleet' }
    ],
    getWarehouseFleetLabel() {
      const opt = this.warehouseFleetOptions.find(
        (o) => o.value === String(this.warehouseColdChainFilter)
      )
      return opt ? opt.label : 'All Fleets'
    },

    // Product Catalog Filters & Raw Payload
    productSearch: '',
    productCategories: [],
    productColdChainFilter: '',
    showRawProductsJson: false,
    rawProductsResponse: null,

    productCategoryList: [
      { value: 'medical_supplies', label: 'Medical Supplies' },
      { value: 'pharmaceutical', label: 'Pharmaceutical' }
    ],
    getProductCategoryLabel() {
      if (this.productCategories.length === 0) return 'All Categories'
      if (this.productCategories.length === 1) {
        const item = this.productCategoryList.find((c) => c.value === this.productCategories[0])
        return item ? item.label : this.productCategories[0]
      }
      return `${this.productCategories.length} Categories`
    },
    toggleProductCategory(cat) {
      const idx = this.productCategories.indexOf(cat)
      if (idx >= 0) {
        this.productCategories.splice(idx, 1)
      } else {
        this.productCategories.push(cat)
      }
      this.onProductFilterChange(true)
    },
    selectAllCategories() {
      this.productCategories = this.productCategoryList.map((c) => c.value)
      this.onProductFilterChange(true)
    },
    clearAllCategories() {
      this.productCategories = []
      this.onProductFilterChange(true)
    },

    productColdChainOptions: [
      { value: '', label: 'All Temperatures' },
      { value: 'true', label: 'Cold Chain (2-8°C)' },
      { value: 'false', label: 'Ambient Storage' }
    ],
    getProductColdChainLabel() {
      const opt = this.productColdChainOptions.find(
        (o) => o.value === String(this.productColdChainFilter)
      )
      return opt ? opt.label : 'All Temperatures'
    },

    // Traffic Analytics Filters & Raw Payload
    trafficWarehouses: [],
    trafficDays: [],
    trafficDurationRange: '',
    trafficSearch: '',
    showRawTrafficJson: false,
    rawTrafficResponse: null,
    filterDebounceTimer: null,

    trafficWarehouseList: [
      { value: 'W01', label: 'W01 - Surabaya' },
      { value: 'W02', label: 'W02 - Sidoarjo' },
      { value: 'W03', label: 'W03 - Gresik' },
      { value: 'W04', label: 'W04 - Pasuruan' },
      { value: 'W05', label: 'W05 - Malang' },
      { value: 'W06', label: 'W06 - Jember' },
      { value: 'W07', label: 'W07 - Surabaya Barat' },
      { value: 'W08', label: 'W08 - Sidoarjo Selatan' }
    ],
    getTrafficWarehouseLabel() {
      if (this.trafficWarehouses.length === 0) return 'All Warehouses'
      if (this.trafficWarehouses.length === 1) return this.trafficWarehouses[0]
      return `${this.trafficWarehouses.length} Warehouses`
    },
    toggleTrafficWarehouse(wid) {
      const idx = this.trafficWarehouses.indexOf(wid)
      if (idx >= 0) {
        this.trafficWarehouses.splice(idx, 1)
      } else {
        this.trafficWarehouses.push(wid)
      }
      this.onTrafficFilterChange(true)
    },
    selectAllTrafficWarehouses() {
      this.trafficWarehouses = this.trafficWarehouseList.map((w) => w.value)
      this.onTrafficFilterChange(true)
    },
    clearAllTrafficWarehouses() {
      this.trafficWarehouses = []
      this.onTrafficFilterChange(true)
    },

    trafficDayList: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    getTrafficDayLabel() {
      if (this.trafficDays.length === 0) return 'All Days'
      if (this.trafficDays.length === 1) return this.trafficDays[0]
      return `${this.trafficDays.length} Days`
    },
    toggleTrafficDay(day) {
      const idx = this.trafficDays.indexOf(day)
      if (idx >= 0) {
        this.trafficDays.splice(idx, 1)
      } else {
        this.trafficDays.push(day)
      }
      this.onTrafficFilterChange(true)
    },
    selectAllTrafficDays() {
      this.trafficDays = [...this.trafficDayList]
      this.onTrafficFilterChange(true)
    },
    clearAllTrafficDays() {
      this.trafficDays = []
      this.onTrafficFilterChange(true)
    },

    trafficDurationOptions: [
      { value: '', label: 'All Durations' },
      { value: 'lte:30', label: 'Fast (≤ 30 min)' },
      { value: 'gte:60', label: 'Congested (≥ 60 min)' },
      { value: 'gte:120', label: 'Severe Peak (≥ 120 min)' }
    ],
    getTrafficDurationLabel() {
      const opt = this.trafficDurationOptions.find((o) => o.value === this.trafficDurationRange)
      return opt ? opt.label : 'All Durations'
    },

    // Multi-Field Sorting state per collection
    warehouseSort: [],
    productSort: [],
    trafficSort: [],

    toggleTableSort(tab, field) {
      const sortList =
        tab === 'warehouses'
          ? this.warehouseSort
          : tab === 'products'
            ? this.productSort
            : this.trafficSort

      const existingIdx = sortList.findIndex((s) => s.field === field)

      if (existingIdx >= 0) {
        if (sortList[existingIdx].order === 'asc') {
          sortList[existingIdx].order = 'desc'
        } else {
          sortList.splice(existingIdx, 1)
        }
      } else {
        // Simple direct click sets primary sort
        sortList.length = 0
        sortList.push({ field, order: 'asc' })
      }

      if (tab === 'warehouses') this.fetchWarehouses()
      else if (tab === 'products') this.fetchProducts()
      else if (tab === 'traffic') this.fetchTraffic()
    },

    addSortLevel(tab, field, order = 'asc') {
      const sortList =
        tab === 'warehouses'
          ? this.warehouseSort
          : tab === 'products'
            ? this.productSort
            : this.trafficSort

      const existingIdx = sortList.findIndex((s) => s.field === field)
      if (existingIdx >= 0) {
        sortList[existingIdx].order = order
      } else {
        sortList.push({ field, order })
      }

      if (tab === 'warehouses') this.fetchWarehouses()
      else if (tab === 'products') this.fetchProducts()
      else if (tab === 'traffic') this.fetchTraffic()
    },

    getSortInfo(tab, field) {
      const sortList =
        tab === 'warehouses'
          ? this.warehouseSort
          : tab === 'products'
            ? this.productSort
            : this.trafficSort
      const idx = sortList.findIndex((s) => s.field === field)
      if (idx === -1) {
        return { active: false, order: null, level: 0 }
      }
      return { active: true, order: sortList[idx].order, level: idx + 1 }
    },

    removeSortCriterion(tab, field) {
      const sortList =
        tab === 'warehouses'
          ? this.warehouseSort
          : tab === 'products'
            ? this.productSort
            : this.trafficSort
      const idx = sortList.findIndex((s) => s.field === field)
      if (idx >= 0) {
        sortList.splice(idx, 1)
        if (tab === 'warehouses') this.fetchWarehouses()
        else if (tab === 'products') this.fetchProducts()
        else if (tab === 'traffic') this.fetchTraffic()
      }
    },

    clearSort(tab) {
      if (tab === 'warehouses') {
        this.warehouseSort = []
        this.fetchWarehouses()
      } else if (tab === 'products') {
        this.productSort = []
        this.fetchProducts()
      } else if (tab === 'traffic') {
        this.trafficSort = []
        this.fetchTraffic()
      }
    },

    formatSortField(field) {
      const labels = {
        id: 'ID',
        name: 'Name',
        location: 'Location',
        distanceKm: 'Distance',
        storageType: 'Storage',
        fleetType: 'Fleet',
        isColdChainCapable: 'Cold Fleet',
        category: 'Category',
        requiresColdChain: 'Temperature',
        deliveryId: 'Delivery ID',
        warehouseId: 'Warehouse',
        dayOfWeek: 'Day',
        timeString: 'Time',
        actualDurationMinutes: 'Duration'
      }
      return labels[field] || field
    },

    async init() {
      await Promise.all([this.fetchProducts(), this.fetchWarehouses(), this.fetchTraffic()])
      // Initial fulfillment evaluation so the page immediately displays live results
      await this.submitFulfillment()

      // Initialize TimepickerUI with DaisyUI theme integration
      this.$nextTick(() => {
        this.initTimepicker()
      })
    },

    initTimepicker() {
      const wrapperEl =
        document.getElementById('departure-time-wrapper') ||
        document.getElementById('departure-time-input')
      if (!wrapperEl) return

      const TimepickerClass =
        window.TimepickerUI &&
        (window.TimepickerUI.TimepickerUI || window.TimepickerUI.default || window.TimepickerUI)

      if (!TimepickerClass) {
        console.warn('TimepickerUI library not available')
        return
      }

      try {
        this.timepicker = new TimepickerClass(wrapperEl, {
          clock: {
            type: '24h',
            incrementHours: 1,
            incrementMinutes: 5,
            autoSwitchToMinutes: true
          },
          ui: {
            theme: 'basic',
            mode: 'clock',
            animation: true,
            backdrop: true,
            editable: false
          },
          labels: {
            time: 'Select Departure Time (24h)',
            ok: 'Apply',
            cancel: 'Cancel'
          },
          callbacks: {
            onConfirm: (data) => {
              if (!data) return
              const hour = String(data.hour ?? '00').padStart(2, '0')
              const min = String(data.minutes ?? '00').padStart(2, '0')
              this.selectedTime = `${hour}:${min}`
              this.onCustomTimeChange(false)
            }
          }
        })

        this.timepicker.create()

        // Also bind event listener fallback for confirm
        this.timepicker.on('confirm', (data) => {
          if (!data) return
          const hour = String(data.hour ?? '00').padStart(2, '0')
          const min = String(data.minutes ?? '00').padStart(2, '0')
          this.selectedTime = `${hour}:${min}`
          this.onCustomTimeChange(false)
        })

        // Set initial value in timepicker
        if (this.selectedTime && typeof this.timepicker.setValue === 'function') {
          this.timepicker.setValue(this.selectedTime)
        }
      } catch (err) {
        console.error('Failed to initialize TimepickerUI:', err)
      }
    },

    // ─── Data Fetching ──────────────────────────────────────────

    async fetchProducts() {
      try {
        const params = new URLSearchParams()
        if (this.productSearch) params.set('search', this.productSearch.trim())
        if (this.productCategories && this.productCategories.length > 0) {
          for (const c of this.productCategories) {
            params.append('category.in', c)
          }
        }
        if (this.productColdChainFilter !== '') {
          params.set('requiresColdChain', this.productColdChainFilter)
        }
        if (this.productSort && this.productSort.length > 0) {
          for (const s of this.productSort) {
            params.append('sort', (s.order === 'desc' ? '-' : '+') + s.field)
          }
        }
        const qs = params.toString() ? `?${params.toString()}` : ''
        const t0 = performance.now()
        const res = await fetch(`/api/v1/products${qs}`)
        const json = await res.json()
        const t1 = performance.now()
        if (json.meta) json.meta.durationMs = Math.round((t1 - t0) * 10) / 10
        this.rawProductsResponse = json
        if (json.success) {
          this.products = json.data
        }
      } catch (err) {
        console.error('Failed to load products:', err)
      }
    },

    onProductFilterChange(immediate = false) {
      if (this.filterDebounceTimer) clearTimeout(this.filterDebounceTimer)
      if (immediate) {
        this.fetchProducts()
        return
      }
      this.filterDebounceTimer = setTimeout(() => {
        this.fetchProducts()
      }, 250)
    },

    resetProductFilters() {
      this.productSearch = ''
      this.productCategories = []
      this.productColdChainFilter = ''
      this.productSort = []
      this.fetchProducts()
    },

    async fetchWarehouses() {
      try {
        const params = new URLSearchParams()
        if (this.warehouseSearch) params.set('search', this.warehouseSearch.trim())
        if (this.warehouseCities && this.warehouseCities.length > 0) {
          for (const c of this.warehouseCities) {
            params.append('city.in', c)
          }
        }
        if (this.warehouseDistanceRange) {
          params.set('distanceKm.lte', this.warehouseDistanceRange)
        }
        if (this.warehouseColdChainFilter !== '') {
          params.set('isColdChainCapable', this.warehouseColdChainFilter)
        }
        if (this.warehouseSort && this.warehouseSort.length > 0) {
          for (const s of this.warehouseSort) {
            params.append('sort', (s.order === 'desc' ? '-' : '+') + s.field)
          }
        }
        const qs = params.toString() ? `?${params.toString()}` : ''
        const t0 = performance.now()
        const res = await fetch(`/api/v1/warehouses${qs}`)
        const json = await res.json()
        const t1 = performance.now()
        if (json.meta) json.meta.durationMs = Math.round((t1 - t0) * 10) / 10
        this.rawWarehousesResponse = json
        if (json.success) {
          this.warehouses = json.data
        }
      } catch (err) {
        console.error('Failed to load warehouses:', err)
      }
    },

    onWarehouseFilterChange(immediate = false) {
      if (this.filterDebounceTimer) clearTimeout(this.filterDebounceTimer)
      if (immediate) {
        this.fetchWarehouses()
        return
      }
      this.filterDebounceTimer = setTimeout(() => {
        this.fetchWarehouses()
      }, 250)
    },

    resetWarehouseFilters() {
      this.warehouseSearch = ''
      this.warehouseCities = []
      this.warehouseDistanceRange = ''
      this.warehouseColdChainFilter = ''
      this.warehouseSort = []
      this.fetchWarehouses()
    },

    async fetchTraffic() {
      try {
        const params = new URLSearchParams()
        if (this.trafficSearch) params.set('search', this.trafficSearch.trim())
        if (this.trafficWarehouses && this.trafficWarehouses.length > 0) {
          for (const w of this.trafficWarehouses) {
            params.append('warehouseId.in', w)
          }
        }
        if (this.trafficDays && this.trafficDays.length > 0) {
          for (const d of this.trafficDays) {
            params.append('dayOfWeek.in', d)
          }
        }
        if (this.trafficDurationRange) {
          if (this.trafficDurationRange.startsWith('lte:')) {
            params.set('actualDurationMinutes.lte', this.trafficDurationRange.slice(4))
          } else if (this.trafficDurationRange.startsWith('gte:')) {
            params.set('actualDurationMinutes.gte', this.trafficDurationRange.slice(4))
          }
        }
        if (this.trafficSort && this.trafficSort.length > 0) {
          for (const s of this.trafficSort) {
            params.append('sort', (s.order === 'desc' ? '-' : '+') + s.field)
          }
        }
        const qs = params.toString() ? `?${params.toString()}` : ''
        const t0 = performance.now()
        const res = await fetch(`/api/v1/traffic/patterns${qs}`)
        const json = await res.json()
        const t1 = performance.now()
        if (json.meta) json.meta.durationMs = Math.round((t1 - t0) * 10) / 10
        this.rawTrafficResponse = json
        if (json.success) {
          this.trafficSummary = json.data.summary
          this.trafficRecords = json.data.records
        }
      } catch (err) {
        console.error('Failed to load traffic patterns:', err)
      }
    },

    onTrafficFilterChange(immediate = false) {
      if (this.filterDebounceTimer) clearTimeout(this.filterDebounceTimer)
      if (immediate) {
        this.fetchTraffic()
        return
      }
      this.filterDebounceTimer = setTimeout(() => {
        this.fetchTraffic()
      }, 250)
    },

    resetTrafficFilters() {
      this.trafficSearch = ''
      this.trafficWarehouses = []
      this.trafficDays = []
      this.trafficDurationRange = ''
      this.trafficSort = []
      this.fetchTraffic()
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

    formatStorage(type) {
      if (!type) return 'Unknown'
      return type === 'refrigerated' ? 'Refrigerated Unit' : 'Ambient Storage'
    },

    formatFleet(type) {
      if (!type) return 'Unknown'
      return type === 'refrigerated' ? 'Refrigerated Fleet' : 'Standard Fleet'
    },

    formatCategory(cat) {
      if (!cat) return ''
      return cat === 'pharmaceutical' ? 'Pharmaceutical' : 'Medical Supplies'
    },

    getTotalStock(productId) {
      const product = this.getProduct(productId)
      if (!product || !this.warehouses.length) return 0

      // For cold chain vaccines, count only warehouses with active refrigerated fleet (W04, W07, W08)
      const qualifiedWh = product.requiresColdChain
        ? this.warehouses.filter((w) => w.isColdChainCapable)
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

    selectPresetTime(day, time) {
      this.selectedDay = day
      this.selectedTime = time
      this.orderTime = `${day}, ${time}`
      if (this.timepicker && typeof this.timepicker.setValue === 'function') {
        try {
          this.timepicker.setValue(time)
        } catch {
          // ignore transient sync errors
        }
      }
      this.onOrderChange(true)
    },

    onCustomTimeChange(syncPicker = true) {
      if (!this.selectedDay) this.selectedDay = 'Mon'
      if (!this.selectedTime) this.selectedTime = '12:00'
      this.orderTime = `${this.selectedDay}, ${this.selectedTime}`
      if (syncPicker && this.timepicker && typeof this.timepicker.setValue === 'function') {
        try {
          this.timepicker.setValue(this.selectedTime)
        } catch {
          // ignore transient sync errors
        }
      }
      this.onOrderChange(true)
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
        if (preset.time && preset.time.includes(',')) {
          const parts = preset.time.split(',').map((s) => s.trim())
          this.selectedDay = parts[0]
          this.selectedTime = parts[1] || '12:00'
          if (this.timepicker && typeof this.timepicker.setValue === 'function') {
            try {
              this.timepicker.setValue(this.selectedTime)
            } catch {
              // ignore transient sync errors
            }
          }
        }
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
      const fetchStart = performance.now()

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
        this.rawResponse = json

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
          this.meta = json.meta
          this.result = null
        }
      } catch (err) {
        this.error = { message: err.message || 'Fulfillment request failed.' }
        this.result = null
        this.rawResponse = {
          success: false,
          data: null,
          error: this.error,
          meta: { timestamp: new Date().toISOString() }
        }
      } finally {
        // Enforce smooth minimum display duration (280ms) to eliminate micro-blinking on instant local responses
        const elapsed = performance.now() - fetchStart
        if (elapsed < 280) {
          await new Promise((resolve) => setTimeout(resolve, 280 - elapsed))
        }
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
