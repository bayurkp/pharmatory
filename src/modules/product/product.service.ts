import { ProductRepository } from './product.repository.js'
import { Product } from './product.types.js'
import { NotFoundError } from '../../shared/errors/app-error.js'
import {
  parseSortQuery,
  validateSortFields,
  applyMultiFieldSort
} from '../../shared/utils/by-json-query.util.js'

const ALLOWED_PRODUCT_SORT_FIELDS = ['id', 'name', 'category', 'requiresColdChain', 'description']

export class ProductService {
  constructor(private readonly productRepo: ProductRepository) {}

  getAllProducts(filters?: {
    category?: string
    categories?: string[]
    requiresColdChain?: boolean
    coldChainRequired?: boolean
    search?: string
    sort?: string | string[]
  }): Product[] {
    let products = this.productRepo.findAll()

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim()
      products = products.filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      )
    }

    if (filters?.categories && filters.categories.length > 0) {
      const targetCategories = filters.categories.map((c) => c.toLowerCase().replace(/\s+/g, '_'))
      products = products.filter((p) =>
        targetCategories.includes(p.category.toLowerCase().replace(/\s+/g, '_'))
      )
    } else if (filters?.category) {
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

    if (filters?.sort) {
      const criteria = parseSortQuery(filters.sort)
      validateSortFields(criteria, ALLOWED_PRODUCT_SORT_FIELDS)
      products = applyMultiFieldSort(products, criteria, 'id')
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
