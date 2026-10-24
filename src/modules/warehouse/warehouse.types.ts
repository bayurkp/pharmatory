import { ProductCategory } from '../product/product.types.js'

export const StorageType = {
  AMBIENT: 'ambient',
  REFRIGERATED: 'refrigerated'
} as const

export type StorageType = (typeof StorageType)[keyof typeof StorageType]

export const FleetType = {
  STANDARD: 'standard',
  REFRIGERATED: 'refrigerated'
} as const

export type FleetType = (typeof FleetType)[keyof typeof FleetType]

export const StorageTypeLabels: Record<StorageType, string> = {
  [StorageType.AMBIENT]: 'Ambient Storage',
  [StorageType.REFRIGERATED]: 'Refrigerated Unit'
}

export const FleetTypeLabels: Record<FleetType, string> = {
  [FleetType.STANDARD]: 'Standard Fleet',
  [FleetType.REFRIGERATED]: 'Refrigerated Fleet'
}

export interface WarehouseStockItem {
  productId: string
  productName: string
  category: ProductCategory
  requiresColdChain: boolean
  quantity: number
}

export interface Warehouse {
  id: string
  name: string
  location: string
  distanceKm: number
  storageType: StorageType
  fleetType: FleetType
  isColdChainCapable: boolean
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
  is_cold_chain_capable: number
}

export interface RawWarehouseStockRow {
  warehouse_id: string
  product_id: string
  product_name: string
  category: string
  requires_cold_chain: number
  quantity: number
}

export function mapWarehouseRow(row: RawWarehouseRow): Warehouse {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    distanceKm: row.distance_km,
    storageType: row.storage_type as StorageType,
    fleetType: row.fleet_type as FleetType,
    isColdChainCapable: Boolean(row.is_cold_chain_capable)
  }
}
