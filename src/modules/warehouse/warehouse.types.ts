export interface WarehouseStockItem {
  productId: string
  productName: string
  category: string
  coldChainRequired: boolean
  quantity: number
}

export interface Warehouse {
  id: string
  name: string
  location: string
  distanceKm: number
  storageType: string
  fleetType: string
  fullColdChainCapable: boolean
  stocks?: Record<string, number>
  inventory?: WarehouseStockItem[]
}

export interface RawWarehouseRow {
  id: string
  name: string
  location: string
  distance_km: number
  storage_type: string
  fleet_type: string
  full_cold_chain_capable: number
}

export interface RawWarehouseStockRow {
  warehouse_id: string
  product_id: string
  product_name: string
  category: string
  cold_chain_required: number
  quantity: number
}

export function mapWarehouseRow(row: RawWarehouseRow): Warehouse {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    distanceKm: row.distance_km,
    storageType: row.storage_type,
    fleetType: row.fleet_type,
    fullColdChainCapable: Boolean(row.full_cold_chain_capable)
  }
}
