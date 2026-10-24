import { ProductRepository } from './product.repository.js'
import { Product } from './product.types.js'
import { NotFoundError } from '../../shared/errors/app-error.js'

export class ProductService {
  constructor(private readonly productRepo: ProductRepository) {}

  getAllProducts(filters?: {
    category?: string
    requiresColdChain?: boolean
    coldChainRequired?: boolean
  }): Product[] {
    let products = this.productRepo.findAll()

    if (filters?.category) {
      const cat = filters.category.toLowerCase().replace(/\s+/g, '_')
      products = products.filter(
        (p) =>
          p.category.toLowerCase() === cat ||
          p.category.toLowerCase() === filters.category!.toLowerCase()
      )
    }

    const coldChain = filters?.requiresColdChain ?? filters?.coldChainRequired
    if (typeof coldChain === 'boolean') {
      products = products.filter((p) => p.requiresColdChain === coldChain)
    }

    return products
  }

  getProductById(id: string): Product {
    const product = this.productRepo.findById(id)
    if (!product) {
      throw new NotFoundError(`Product with ID '${id}' was not found.`)
    }
    return product
  }
}
