import Database from 'better-sqlite3'
import { Product, RawProductRow, mapProductRow } from './product.types.js'
import { SortCriterion } from '../../shared/utils/by-json-query.util.js'

export interface ProductFilterParams {
  search?: string
  categories?: string[]
  category?: string
  requiresColdChain?: boolean
  sortCriteria?: SortCriterion[]
}

export class ProductRepository {
  constructor(private readonly db: Database.Database) {}

  findAll(): Product[] {
    const rows = this.db.prepare('SELECT * FROM products ORDER BY id ASC').all() as RawProductRow[]
    return rows.map(mapProductRow)
  }

  findById(id: string): Product | null {
    const row = this.db.prepare('SELECT * FROM products WHERE id = ?').get(id) as
      RawProductRow | undefined
    return row ? mapProductRow(row) : null
  }

  findManyByIds(ids: string[]): Product[] {
    if (ids.length === 0) return []
    const placeholders = ids.map(() => '?').join(', ')
    const rows = this.db
      .prepare(`SELECT * FROM products WHERE id IN (${placeholders})`)
      .all(...ids) as RawProductRow[]
    return rows.map(mapProductRow)
  }

  /**
   * Performs all filtering, searching, and multi-field sorting directly within SQLite.
   */
  findFiltered(params: ProductFilterParams): Product[] {
    const whereClauses: string[] = []
    const sqlParams: unknown[] = []

    if (params.search) {
      const q = `%${params.search.toLowerCase().trim()}%`
      whereClauses.push('(LOWER(id) LIKE ? OR LOWER(name) LIKE ? OR LOWER(description) LIKE ?)')
      sqlParams.push(q, q, q)
    }

    if (params.categories && params.categories.length > 0) {
      const placeholders = params.categories.map(() => '?').join(', ')
      whereClauses.push(`LOWER(category) IN (${placeholders})`)
      sqlParams.push(...params.categories.map((c) => c.toLowerCase().trim()))
    } else if (params.category) {
      whereClauses.push('LOWER(category) = ?')
      sqlParams.push(params.category.toLowerCase().trim())
    }

    if (typeof params.requiresColdChain === 'boolean') {
      whereClauses.push('requires_cold_chain = ?')
      sqlParams.push(params.requiresColdChain ? 1 : 0)
    }

    let orderByClause = 'ORDER BY id ASC'
    if (params.sortCriteria && params.sortCriteria.length > 0) {
      const columnMap: Record<string, string> = {
        id: 'id',
        name: 'name',
        category: 'category',
        requiresColdChain: 'requires_cold_chain',
        description: 'description'
      }

      const orderTokens = params.sortCriteria.map(
        ({ field, order }) => `${columnMap[field] || 'id'} ${order.toUpperCase()}`
      )
      if (!orderTokens.some((t) => t.startsWith('id '))) {
        orderTokens.push('id ASC')
      }
      orderByClause = `ORDER BY ${orderTokens.join(', ')}`
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''
    const sql = `SELECT * FROM products ${whereSql} ${orderByClause}`

    const rows = this.db.prepare(sql).all(...sqlParams) as RawProductRow[]
    return rows.map(mapProductRow)
  }
}
