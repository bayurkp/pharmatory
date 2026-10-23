import { FastifyInstance } from 'fastify'
import { ProductRepository } from './product.repository.js'
import { ProductService } from './product.service.js'
import { ProductController } from './product.controller.js'
import { getProductsSchema } from './product.schema.js'
import { getDatabase } from '../../db/connection.js'

export async function productRoutes(fastify: FastifyInstance): Promise<void> {
  const db = getDatabase()
  const productRepository = new ProductRepository(db)
  const productService = new ProductService(productRepository)
  const productController = new ProductController(productService)

  fastify.get('/', { schema: getProductsSchema }, productController.getProducts)
}
