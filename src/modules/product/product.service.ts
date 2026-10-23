import { ProductRepository } from './product.repository.js'
import { Product } from './product.types.js'
import { NotFoundError } from '../../shared/errors/app-error.js'

export class ProductService {
  constructor(private readonly productRepo: ProductRepository) {}

  getAllProducts(filters?: { category?: string; coldChainRequired?: boolean }): Product[] {
    let products = this.productRepo.findAll()

    if (filters?.category) {
      const cat = filters.category.toLowerCase()
      products = products.filter((p) => p.category.toLowerCase() === cat)
    }

    if (typeof filters?.coldChainRequired === 'boolean') {
      products = products.filter((p) => p.coldChainRequired === filters.coldChainRequired)
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
