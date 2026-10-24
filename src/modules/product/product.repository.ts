import Database from 'better-sqlite3'
import { Product, RawProductRow, mapProductRow } from './product.types.js'

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
}
