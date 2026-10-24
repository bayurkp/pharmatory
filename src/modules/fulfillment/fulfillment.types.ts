import { TrafficEstimation } from '../traffic/traffic.types.js'
import { ProductCategory } from '../product/product.types.js'
import { StorageType, FleetType } from '../warehouse/warehouse.types.js'

export interface OrderItem {
  productId: string
  quantity: number
}

export interface FulfillOrderRequest {
  items: OrderItem[]
  orderTime?: string
  customerLocation?: string
}

export interface FulfillmentShipmentItem {
  productId: string
  productName: string
  category: ProductCategory
  requiresColdChain: boolean
  quantity: number
}

export interface FulfillmentShipment {
  warehouseId: string
  warehouseName: string
  location: string
  distanceKm: number
  storageType: StorageType
  fleetType: FleetType
  isColdChainCapable: boolean
  estimatedDurationMinutes: number
  trafficDetails: TrafficEstimation
  items: FulfillmentShipmentItem[]
}

export interface FulfillmentDecisionFactors {
  stockChecked: boolean
  coldChainChecked: boolean
  trafficAdjusted: boolean
  singleWarehouseEvaluated: boolean
  splitReason?: string
}

export interface FulfillmentPlan {
  strategy: 'single_warehouse' | 'split_order'
  totalShipments: number
  totalDistanceKm: number
  maxEstimatedDurationMinutes: number
  coldChainCompliance: 'verified' | 'not_applicable' | 'warning'
  shipments: FulfillmentShipment[]
  explanation: string
  decisionFactors: FulfillmentDecisionFactors
}
