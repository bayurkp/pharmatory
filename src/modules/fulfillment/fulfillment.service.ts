import { ProductRepository } from '../product/product.repository.js'
import { WarehouseRepository } from '../warehouse/warehouse.repository.js'
import { TrafficService } from '../traffic/traffic.service.js'
import { FulfillmentEngine } from './fulfillment.engine.js'
import { FulfillOrderRequest, FulfillmentPlan } from './fulfillment.types.js'

export class FulfillmentService {
  private engine: FulfillmentEngine

  constructor(
    private readonly productRepo: ProductRepository,
    private readonly warehouseRepo: WarehouseRepository,
    private readonly trafficService: TrafficService
  ) {
    this.engine = new FulfillmentEngine(this.trafficService)
  }

  async fulfillOrder(request: FulfillOrderRequest): Promise<FulfillmentPlan> {
    await this.trafficService.initialize()
    const products = this.productRepo.findAll()
    const warehouses = this.warehouseRepo.findAllWithInventories()

    return this.engine.evaluate(request.items, products, warehouses, request.orderTime)
  }
}
