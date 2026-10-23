import { TrafficEstimation } from '../traffic/traffic.types.js'

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
  category: string
  coldChainRequired: boolean
  quantity: number
}

export interface FulfillmentShipment {
  warehouseId: string
  warehouseName: string
  location: string
  distanceKm: number
  storageType: string
  fleetType: string
  fullColdChainCapable: boolean
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
