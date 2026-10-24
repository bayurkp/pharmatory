import { WarehouseRepository } from './warehouse.repository.js'
import { Warehouse } from './warehouse.types.js'
import { NotFoundError } from '../../shared/errors/app-error.js'

export class WarehouseService {
  constructor(private readonly warehouseRepo: WarehouseRepository) {}

  getAllWarehouses(filters?: {
    location?: string
    isColdChainCapable?: boolean
    fullColdChainCapable?: boolean
  }): Warehouse[] {
    let warehouses = this.warehouseRepo.findAllWithInventories()

    if (filters?.location) {
      const loc = filters.location.toLowerCase()
      warehouses = warehouses.filter((w) => w.location.toLowerCase() === loc)
    }

    const capable = filters?.isColdChainCapable ?? filters?.fullColdChainCapable
    if (typeof capable === 'boolean') {
      warehouses = warehouses.filter((w) => w.isColdChainCapable === capable)
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
