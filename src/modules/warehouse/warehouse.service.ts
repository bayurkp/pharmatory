import { WarehouseRepository } from './warehouse.repository.js'
import { Warehouse } from './warehouse.types.js'
import { NotFoundError } from '../../shared/errors/app-error.js'
import {
  parseSortQuery,
  validateSortFields,
  applyMultiFieldSort
} from '../../shared/utils/by-json-query.util.js'

const ALLOWED_WAREHOUSE_SORT_FIELDS = [
  'id',
  'name',
  'location',
  'distanceKm',
  'storageType',
  'fleetType',
  'isColdChainCapable'
]

export class WarehouseService {
  constructor(private readonly warehouseRepo: WarehouseRepository) {}

  getAllWarehouses(filters?: {
    location?: string
    cities?: string[]
    minDistanceKm?: number
    maxDistanceKm?: number
    isColdChainCapable?: boolean
    fullColdChainCapable?: boolean
    storageType?: string
    search?: string
    sort?: string | string[]
  }): Warehouse[] {
    let warehouses = this.warehouseRepo.findAllWithInventories()

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim()
      warehouses = warehouses.filter(
        (w) =>
          w.id.toLowerCase().includes(q) ||
          w.name.toLowerCase().includes(q) ||
          w.location.toLowerCase().includes(q)
      )
    }

    if (filters?.cities && filters.cities.length > 0) {
      const targetCities = filters.cities.map((c) => c.toLowerCase().trim())
      warehouses = warehouses.filter((w) => targetCities.includes(w.location.toLowerCase()))
    } else if (filters?.location) {
      const loc = filters.location.toLowerCase().trim()
      warehouses = warehouses.filter((w) => w.location.toLowerCase() === loc)
    }

    if (filters?.minDistanceKm !== undefined && !isNaN(filters.minDistanceKm)) {
      warehouses = warehouses.filter((w) => w.distanceKm >= filters.minDistanceKm!)
    }

    if (filters?.maxDistanceKm !== undefined && !isNaN(filters.maxDistanceKm)) {
      warehouses = warehouses.filter((w) => w.distanceKm <= filters.maxDistanceKm!)
    }

    if (filters?.storageType) {
      const st = filters.storageType.toLowerCase().trim()
      warehouses = warehouses.filter((w) => w.storageType.toLowerCase() === st)
    }

    const capable = filters?.isColdChainCapable ?? filters?.fullColdChainCapable
    if (typeof capable === 'boolean') {
      warehouses = warehouses.filter((w) => w.isColdChainCapable === capable)
    }

    if (filters?.sort) {
      const criteria = parseSortQuery(filters.sort)
      validateSortFields(criteria, ALLOWED_WAREHOUSE_SORT_FIELDS)
      warehouses = applyMultiFieldSort(warehouses, criteria, 'id')
    }

    return warehouses
  }

  getWarehouseById(id: string): Warehouse {
    const warehouse = this.warehouseRepo.findById(id)
    if (!warehouse) {
      throw new NotFoundError(`Warehouse with ID '${id}' was not found.`)
    }
    return warehouse
  }
}
