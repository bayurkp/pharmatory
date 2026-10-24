import { FastifyInstance } from 'fastify'
import { ProductRepository } from '../product/product.repository.js'
import { WarehouseRepository } from '../warehouse/warehouse.repository.js'
import { getTrafficService } from '../traffic/traffic.service.js'
import { FulfillmentService } from './fulfillment.service.js'
import { FulfillmentController } from './fulfillment.controller.js'
import { fulfillOrderSchema } from './fulfillment.schema.js'
import { getDatabase } from '../../db/connection.js'

export async function fulfillmentRoutes(fastify: FastifyInstance): Promise<void> {
  const db = getDatabase()
  const productRepository = new ProductRepository(db)
  const warehouseRepository = new WarehouseRepository(db)
  const trafficService = getTrafficService()
  const fulfillmentService = new FulfillmentService(
    productRepository,
    warehouseRepository,
    trafficService
  )
  const fulfillmentController = new FulfillmentController(fulfillmentService)

  // 1. Process Endpoint conforming to ByJSON v2.0 Section 3.2: POST /{subsystem}/{verb}
  fastify.post('/fulfill', { schema: fulfillOrderSchema }, fulfillmentController.fulfillOrder)

  // 2. Resource-oriented endpoint alias conforming to ByJSON v2.0 Section 3.1
  fastify.post('/', { schema: fulfillOrderSchema }, fulfillmentController.fulfillOrder)
}
