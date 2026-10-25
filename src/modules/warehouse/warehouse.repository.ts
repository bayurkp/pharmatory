import Database from 'better-sqlite3'
import { ProductCategory } from '../product/product.types.js'
import {
  Warehouse,
  RawWarehouseRow,
  RawWarehouseStockRow,
  mapWarehouseRow,
  WarehouseStockItem
} from './warehouse.types.js'
import { SortCriterion } from '../../shared/utils/by-json-query.util.js'

export interface WarehouseFilterParams {
  search?: string
  cities?: string[]
  location?: string
  minDistanceKm?: number
  maxDistanceKm?: number
  storageType?: string
  isColdChainCapable?: boolean
  sortCriteria?: SortCriterion[]
}

export class WarehouseRepository {
  constructor(private readonly db: Database.Database) {}

  findAll(): Warehouse[] {
    const rows = this.db
      .prepare('SELECT * FROM warehouses ORDER BY distance_km ASC, id ASC')
      .all() as RawWarehouseRow[]
    return rows.map(mapWarehouseRow)
  }

  findById(id: string): Warehouse | null {
    const row = this.db.prepare('SELECT * FROM warehouses WHERE id = ?').get(id) as
      RawWarehouseRow | undefined
    return row ? mapWarehouseRow(row) : null
  }

  findAllWithInventories(): Warehouse[] {
    return this.findFilteredWithInventories({})
  }

  /**
   * Pushes all filtering, searching, and multi-field sorting directly into SQLite.
   * Fetches warehouse stocks in a single bulk query with WHERE warehouse_id IN (...)
   * completely eliminating N+1 queries.
   */
  findFilteredWithInventories(params: WarehouseFilterParams): Warehouse[] {
    const whereClauses: string[] = []
    const sqlParams: unknown[] = []

    if (params.search) {
      const q = `%${params.search.toLowerCase().trim()}%`
      whereClauses.push('(LOWER(id) LIKE ? OR LOWER(name) LIKE ? OR LOWER(location) LIKE ?)')
      sqlParams.push(q, q, q)
    }

    if (params.cities && params.cities.length > 0) {
      const placeholders = params.cities.map(() => '?').join(', ')
      whereClauses.push(`LOWER(location) IN (${placeholders})`)
      sqlParams.push(...params.cities.map((c) => c.toLowerCase().trim()))
    } else if (params.location) {
      whereClauses.push('LOWER(location) = ?')
      sqlParams.push(params.location.toLowerCase().trim())
    }

    if (params.minDistanceKm !== undefined && !isNaN(params.minDistanceKm)) {
      whereClauses.push('distance_km >= ?')
      sqlParams.push(params.minDistanceKm)
    }

    if (params.maxDistanceKm !== undefined && !isNaN(params.maxDistanceKm)) {
      whereClauses.push('distance_km <= ?')
      sqlParams.push(params.maxDistanceKm)
    }

    if (params.storageType) {
      whereClauses.push('LOWER(storage_type) = ?')
      sqlParams.push(params.storageType.toLowerCase().trim())
    }

    if (typeof params.isColdChainCapable === 'boolean') {
      whereClauses.push('is_cold_chain_capable = ?')
      sqlParams.push(params.isColdChainCapable ? 1 : 0)
    }

    let orderByClause = 'ORDER BY distance_km ASC, id ASC'
    if (params.sortCriteria && params.sortCriteria.length > 0) {
      const columnMap: Record<string, string> = {
        id: 'id',
        name: 'name',
        location: 'location',
        distanceKm: 'distance_km',
        storageType: 'storage_type',
        fleetType: 'fleet_type',
        isColdChainCapable: 'is_cold_chain_capable'
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
    const sql = `SELECT * FROM warehouses ${whereSql} ${orderByClause}`

    const rows = this.db.prepare(sql).all(...sqlParams) as RawWarehouseRow[]
    const warehouses = rows.map(mapWarehouseRow)

    if (warehouses.length === 0) {
      return []
    }

    // Single bulk query for all warehouse stocks - Guaranteed NO N+1
    const whIds = warehouses.map((w) => w.id)
    const placeholders = whIds.map(() => '?').join(', ')
    const stockRows = this.db
      .prepare(
        `
      SELECT 
        ws.warehouse_id,
        ws.product_id,
        p.name AS product_name,
        p.category,
        p.requires_cold_chain,
        ws.quantity
      FROM warehouse_stocks ws
      JOIN products p ON ws.product_id = p.id
      WHERE ws.warehouse_id IN (${placeholders})
    `
      )
      .all(...whIds) as RawWarehouseStockRow[]

    const stockMap: Record<
      string,
      { stocks: Record<string, number>; inventory: WarehouseStockItem[] }
    > = {}

    for (const row of stockRows) {
      if (!stockMap[row.warehouse_id]) {
        stockMap[row.warehouse_id] = { stocks: {}, inventory: [] }
      }
      stockMap[row.warehouse_id].stocks[row.product_id] = row.quantity
      stockMap[row.warehouse_id].inventory.push({
        productId: row.product_id,
        productName: row.product_name,
        category: row.category as ProductCategory,
        requiresColdChain: Boolean(row.requires_cold_chain),
        quantity: row.quantity
      })
    }

    return warehouses.map((w) => ({
      ...w,
      stocks: stockMap[w.id]?.stocks || {},
      inventory: stockMap[w.id]?.inventory || []
    }))
  }
}
