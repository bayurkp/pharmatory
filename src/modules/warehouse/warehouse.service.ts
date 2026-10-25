import { WarehouseRepository } from './warehouse.repository.js'
import { Warehouse } from './warehouse.types.js'
import { NotFoundError } from '../../shared/errors/app-error.js'
import {
  parseSortQuery,
  validateSortFields,
  SortCriterion
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
    let sortCriteria: SortCriterion[] = []
    if (filters?.sort) {
      sortCriteria = parseSortQuery(filters.sort)
      validateSortFields(sortCriteria, ALLOWED_WAREHOUSE_SORT_FIELDS)
    }

    const capable = filters?.isColdChainCapable ?? filters?.fullColdChainCapable

    return this.warehouseRepo.findFilteredWithInventories({
      search: filters?.search,
      cities: filters?.cities,
      location: filters?.location,
      minDistanceKm: filters?.minDistanceKm,
      maxDistanceKm: filters?.maxDistanceKm,
      storageType: filters?.storageType,
      isColdChainCapable: typeof capable === 'boolean' ? capable : undefined,
      sortCriteria
    })
  }

  getWarehouseById(id: string): Warehouse {
    const warehouse = this.warehouseRepo.findById(id)
    if (!warehouse) {
      throw new NotFoundError(`Warehouse with ID '${id}' was not found.`)
    }
    return warehouse
  }
}
