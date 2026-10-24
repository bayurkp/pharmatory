import { FastifyRequest, FastifyReply } from 'fastify'
import { ProductService } from './product.service.js'
import { byJsonSuccess } from '../../shared/utils/by-json.util.js'

interface GetProductsQuery {
  category?: string
  requiresColdChain?: boolean | string
  requires_cold_chain?: boolean | string
  coldChain?: boolean | string
  cold_chain?: boolean | string
  coldChainRequired?: boolean | string
}

export class ProductController {
  constructor(private readonly productService: ProductService) {}

  getProducts = async (
    request: FastifyRequest<{ Querystring: GetProductsQuery }>,
    reply: FastifyReply
  ) => {
    const { category } = request.query
    const rawVal =
      request.query.requiresColdChain ??
      request.query.requires_cold_chain ??
      request.query.coldChain ??
      request.query.cold_chain ??
      request.query.coldChainRequired
    const isColdChain =
      rawVal !== undefined
        ? typeof rawVal === 'boolean'
          ? rawVal
          : rawVal === 'true' || rawVal === '1'
        : undefined

    const products = this.productService.getAllProducts({
      category,
      requiresColdChain: isColdChain
    })

    return reply.status(200).send(byJsonSuccess(products, request.id as string))
  }
}
