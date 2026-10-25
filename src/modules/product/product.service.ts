import { ProductRepository } from './product.repository.js'
import { Product } from './product.types.js'
import { NotFoundError } from '../../shared/errors/app-error.js'
import {
  parseSortQuery,
  validateSortFields,
  SortCriterion
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
    let sortCriteria: SortCriterion[] = []
    if (filters?.sort) {
      sortCriteria = parseSortQuery(filters.sort)
      validateSortFields(sortCriteria, ALLOWED_PRODUCT_SORT_FIELDS)
    }

    const coldChain = filters?.requiresColdChain ?? filters?.coldChainRequired

    return this.productRepo.findFiltered({
      category: filters?.category,
      categories: filters?.categories,
      requiresColdChain: typeof coldChain === 'boolean' ? coldChain : undefined,
      search: filters?.search,
      sortCriteria
    })
  }

  getProductById(id: string): Product {
    const product = this.productRepo.findById(id)
    if (!product) {
      throw new NotFoundError(`Product with ID '${id}' was not found.`)
    }
    return product
  }
}
