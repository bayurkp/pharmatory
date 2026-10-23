import Database from 'better-sqlite3'
import {
  Warehouse,
  RawWarehouseRow,
  RawWarehouseStockRow,
  mapWarehouseRow,
  WarehouseStockItem
} from './warehouse.types.js'

export class WarehouseRepository {
  constructor(private readonly db: Database.Database) {}

  findAll(): Warehouse[] {
    const rows = this.db.prepare('SELECT * FROM warehouses ORDER BY distance_km ASC').all() as RawWarehouseRow[]
    return rows.map(mapWarehouseRow)
  }

  findById(id: string): Warehouse | null {
    const row = this.db.prepare('SELECT * FROM warehouses WHERE id = ?').get(id) as RawWarehouseRow | undefined
    return row ? mapWarehouseRow(row) : null
  }

  findAllWithInventories(): Warehouse[] {
    const warehouses = this.findAll()
    const stockRows = this.db.prepare(`
      SELECT 
        ws.warehouse_id,
        ws.product_id,
        p.name AS product_name,
        p.category,
        p.cold_chain_required,
        ws.quantity
      FROM warehouse_stocks ws
      JOIN products p ON ws.product_id = p.id
    `).all() as RawWarehouseStockRow[]

    const stockMap: Record<string, { stocks: Record<string, number>; inventory: WarehouseStockItem[] }> = {}

    for (const row of stockRows) {
      if (!stockMap[row.warehouse_id]) {
        stockMap[row.warehouse_id] = { stocks: {}, inventory: [] }
      }
      stockMap[row.warehouse_id].stocks[row.product_id] = row.quantity
      stockMap[row.warehouse_id].inventory.push({
        productId: row.product_id,
        productName: row.product_name,
        category: row.category,
        coldChainRequired: Boolean(row.cold_chain_required),
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
