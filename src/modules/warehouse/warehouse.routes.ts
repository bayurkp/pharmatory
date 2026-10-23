import { FastifyInstance } from 'fastify'
import { WarehouseRepository } from './warehouse.repository.js'
import { WarehouseService } from './warehouse.service.js'
import { WarehouseController } from './warehouse.controller.js'
import { getWarehousesSchema } from './warehouse.schema.js'
import { getDatabase } from '../../db/connection.js'

export async function warehouseRoutes(fastify: FastifyInstance): Promise<void> {
  const db = getDatabase()
  const warehouseRepository = new WarehouseRepository(db)
  const warehouseService = new WarehouseService(warehouseRepository)
  const warehouseController = new WarehouseController(warehouseService)

  fastify.get('/', { schema: getWarehousesSchema }, warehouseController.getWarehouses)
}
