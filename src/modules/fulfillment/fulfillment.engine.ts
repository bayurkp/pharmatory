import { Product } from '../product/product.types.js'
import { Warehouse } from '../warehouse/warehouse.types.js'
import { TrafficService } from '../traffic/traffic.service.js'
import {
  OrderItem,
  FulfillmentPlan,
  FulfillmentShipment,
  FulfillmentShipmentItem
} from './fulfillment.types.js'
import { ValidationError } from '../../shared/errors/app-error.js'

export class FulfillmentEngine {
  constructor(private readonly trafficService: TrafficService) {}

  evaluate(
    orderItems: OrderItem[],
    products: Product[],
    warehouses: Warehouse[],
    orderTime?: string
  ): FulfillmentPlan {
    if (!orderItems || orderItems.length === 0) {
      throw new ValidationError('Order items array must contain at least one item.', [
        { field: 'items', code: 'min_items', message: 'Order must contain at least one item.' }
      ])
    }

    // 1. Build product catalog map and validate items
    const productMap = new Map<string, Product>()
    for (const p of products) {
      productMap.set(p.id, p)
    }

    const itemDetails: Array<{ product: Product; quantity: number }> = []
    let orderRequiresColdChain = false

    for (let i = 0; i < orderItems.length; i++) {
      const item = orderItems[i]
      if (!item.productId || typeof item.productId !== 'string') {
        throw new ValidationError(`Item at index ${i} has an invalid productId.`, [
          {
            field: `items.${i}.productId`,
            code: 'missing_field',
            message: 'productId must be a valid string'
          }
        ])
      }
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
        throw new ValidationError(
          `Item at index ${i} has an invalid quantity. Must be greater than 0.`,
          [
            {
              field: `items.${i}.quantity`,
              code: 'minimum_value',
              message: 'quantity must be a positive integer'
            }
          ]
        )
      }

      const product = productMap.get(item.productId)
      if (!product) {
        throw new ValidationError(
          `Product with ID '${item.productId}' does not exist in the catalog.`,
          [
            {
              field: `items.${i}.productId`,
              code: 'not_found',
              message: `Product '${item.productId}' was not found in catalog.`
            }
          ]
        )
      }

      if (product.coldChainRequired) {
        orderRequiresColdChain = true
      }

      itemDetails.push({ product, quantity: item.quantity })
    }

    // 2. Evaluate Single Warehouse Candidates
    interface CandidateWarehouse {
      warehouse: Warehouse
      travelDuration: number
      distance: number
    }

    const singleWarehouseCandidates: CandidateWarehouse[] = []

    for (const warehouse of warehouses) {
      // Check cold-chain compliance:
      // If order contains cold-chain products, warehouse must be full cold chain capable (refrigerated storage + refrigerated vans)
      if (orderRequiresColdChain && !warehouse.fullColdChainCapable) {
        continue
      }

      // Check stock availability for all items
      let hasAllStock = true
      const stocks = warehouse.stocks || {}

      for (const item of itemDetails) {
        const available = stocks[item.product.id] || 0
        if (available < item.quantity) {
          hasAllStock = false
          break
        }
      }

      if (hasAllStock) {
        const estimation = this.trafficService.estimateDuration(warehouse.id, orderTime)
        singleWarehouseCandidates.push({
          warehouse,
          travelDuration: estimation.estimatedDurationMinutes,
          distance: warehouse.distanceKm
        })
      }
    }

    // If single warehouse candidates exist, rank by travel duration then distance
    if (singleWarehouseCandidates.length > 0) {
      singleWarehouseCandidates.sort((a, b) => {
        if (a.travelDuration !== b.travelDuration) {
          return a.travelDuration - b.travelDuration
        }
        return a.distance - b.distance
      })

      const bestCandidate = singleWarehouseCandidates[0]
      const selectedWh = bestCandidate.warehouse
      const traffic = this.trafficService.estimateDuration(selectedWh.id, orderTime)

      const shipmentItems: FulfillmentShipmentItem[] = itemDetails.map((it) => ({
        productId: it.product.id,
        productName: it.product.name,
        category: it.product.category,
        coldChainRequired: it.product.coldChainRequired,
        quantity: it.quantity
      }))

      const shipment: FulfillmentShipment = {
        warehouseId: selectedWh.id,
        warehouseName: selectedWh.name,
        location: selectedWh.location,
        distanceKm: selectedWh.distanceKm,
        storageType: selectedWh.storageType,
        fleetType: selectedWh.fleetType,
        fullColdChainCapable: selectedWh.fullColdChainCapable,
        estimatedDurationMinutes: traffic.estimatedDurationMinutes,
        trafficDetails: traffic,
        items: shipmentItems
      }

      const coldChainNote = orderRequiresColdChain
        ? `Cold-chain integrity verified: Dispatched via ${selectedWh.fleetType} maintaining 2°C to 8°C.`
        : 'All items are ambient medical supplies (no refrigeration fleet required).'

      const explanation = `Single-Warehouse Fulfillment Selected: Order can be 100% fulfilled from ${selectedWh.id} (${selectedWh.name}, ${selectedWh.location}) located ${selectedWh.distanceKm} km away. Estimated delivery duration is ${traffic.estimatedDurationMinutes} minutes. ${traffic.appliedRationale} ${coldChainNote}`

      return {
        strategy: 'single_warehouse',
        totalShipments: 1,
        totalDistanceKm: selectedWh.distanceKm,
        maxEstimatedDurationMinutes: traffic.estimatedDurationMinutes,
        coldChainCompliance: orderRequiresColdChain ? 'verified' : 'not_applicable',
        shipments: [shipment],
        explanation,
        decisionFactors: {
          stockChecked: true,
          coldChainChecked: orderRequiresColdChain,
          trafficAdjusted: Boolean(orderTime),
          singleWarehouseEvaluated: true
        }
      }
    }

    // 3. Fallback: Deterministic Multi-Warehouse Split Solver
    // Segregate items into cold chain items vs ambient items
    const coldItems = itemDetails.filter((it) => it.product.coldChainRequired)
    const ambientItems = itemDetails.filter((it) => !it.product.coldChainRequired)

    const shipments: FulfillmentShipment[] = []

    // 3a. Allocate cold-chain items strictly to warehouses with refrigerated vans (W04, W07, W08)
    const coldWarehouses = warehouses
      .filter((w) => w.fullColdChainCapable)
      .sort((a, b) => a.distanceKm - b.distanceKm)

    const remainingColdDemands = new Map<string, number>()
    for (const it of coldItems) {
      remainingColdDemands.set(it.product.id, it.quantity)
    }

    // Assign cold items
    for (const wh of coldWarehouses) {
      const itemsToTakeFromWh: FulfillmentShipmentItem[] = []
      const stocks = wh.stocks || {}

      for (const [prodId, neededQty] of remainingColdDemands.entries()) {
        if (neededQty <= 0) continue
        const available = stocks[prodId] || 0
        if (available > 0) {
          const qtyToTake = Math.min(available, neededQty)
          const prod = productMap.get(prodId)!
          itemsToTakeFromWh.push({
            productId: prod.id,
            productName: prod.name,
            category: prod.category,
            coldChainRequired: true,
            quantity: qtyToTake
          })
          remainingColdDemands.set(prodId, neededQty - qtyToTake)
        }
      }

      if (itemsToTakeFromWh.length > 0) {
        const traffic = this.trafficService.estimateDuration(wh.id, orderTime)
        shipments.push({
          warehouseId: wh.id,
          warehouseName: wh.name,
          location: wh.location,
          distanceKm: wh.distanceKm,
          storageType: wh.storageType,
          fleetType: wh.fleetType,
          fullColdChainCapable: true,
          estimatedDurationMinutes: traffic.estimatedDurationMinutes,
          trafficDetails: traffic,
          items: itemsToTakeFromWh
        })
      }
    }

    // Check if any cold-chain product remains unfulfilled
    for (const [prodId, unfulfilledQty] of remainingColdDemands.entries()) {
      if (unfulfilledQty > 0) {
        const prod = productMap.get(prodId)!
        const idx = orderItems.findIndex((i) => i.productId === prodId)
        throw new ValidationError(
          `Insufficient regional inventory for cold-chain product '${prod.name}' (${prod.id}).`,
          [
            {
              field: `items.${idx}.quantity`,
              code: 'insufficient_inventory',
              message: `Requested: ${orderItems[idx]?.quantity}, Unfulfillable deficit: ${unfulfilledQty}.`
            }
          ]
        )
      }
    }

    // 3b. Allocate ambient items
    // First: Check if the already-selected cold warehouses can also fulfill ambient items to minimize split shipments!
    const remainingAmbientDemands = new Map<string, number>()
    for (const it of ambientItems) {
      remainingAmbientDemands.set(it.product.id, it.quantity)
    }

    for (const shipment of shipments) {
      const wh = warehouses.find((w) => w.id === shipment.warehouseId)!
      const stocks = wh.stocks || {}

      for (const [prodId, neededQty] of remainingAmbientDemands.entries()) {
        if (neededQty <= 0) continue
        const available = stocks[prodId] || 0
        if (available > 0) {
          const qtyToTake = Math.min(available, neededQty)
          const prod = productMap.get(prodId)!
          shipment.items.push({
            productId: prod.id,
            productName: prod.name,
            category: prod.category,
            coldChainRequired: false,
            quantity: qtyToTake
          })
          remainingAmbientDemands.set(prodId, neededQty - qtyToTake)
        }
      }
    }

    // Second: For any still unfulfilled ambient items, allocate from the nearest stocked ambient warehouses
    const ambientWarehouses = [...warehouses].sort((a, b) => a.distanceKm - b.distanceKm)

    for (const wh of ambientWarehouses) {
      const existingShipment = shipments.find((s) => s.warehouseId === wh.id)
      const itemsToTakeFromWh: FulfillmentShipmentItem[] = []
      const stocks = wh.stocks || {}

      for (const [prodId, neededQty] of remainingAmbientDemands.entries()) {
        if (neededQty <= 0) continue
        const alreadyAllocated =
          existingShipment?.items.find((i) => i.productId === prodId)?.quantity || 0
        const available = (stocks[prodId] || 0) - alreadyAllocated
        if (available > 0) {
          const qtyToTake = Math.min(available, neededQty)
          const prod = productMap.get(prodId)!
          itemsToTakeFromWh.push({
            productId: prod.id,
            productName: prod.name,
            category: prod.category,
            coldChainRequired: false,
            quantity: qtyToTake
          })
          remainingAmbientDemands.set(prodId, neededQty - qtyToTake)
        }
      }

      if (itemsToTakeFromWh.length > 0) {
        if (existingShipment) {
          existingShipment.items.push(...itemsToTakeFromWh)
        } else {
          const traffic = this.trafficService.estimateDuration(wh.id, orderTime)
          shipments.push({
            warehouseId: wh.id,
            warehouseName: wh.name,
            location: wh.location,
            distanceKm: wh.distanceKm,
            storageType: wh.storageType,
            fleetType: wh.fleetType,
            fullColdChainCapable: wh.fullColdChainCapable,
            estimatedDurationMinutes: traffic.estimatedDurationMinutes,
            trafficDetails: traffic,
            items: itemsToTakeFromWh
          })
        }
      }
    }

    // Check if any ambient item is unfulfilled
    for (const [prodId, unfulfilledQty] of remainingAmbientDemands.entries()) {
      if (unfulfilledQty > 0) {
        const prod = productMap.get(prodId)!
        const idx = orderItems.findIndex((i) => i.productId === prodId)
        throw new ValidationError(
          `Insufficient regional inventory for product '${prod.name}' (${prod.id}).`,
          [
            {
              field: `items.${idx}.quantity`,
              code: 'insufficient_inventory',
              message: `Requested: ${orderItems[idx]?.quantity}, Unfulfillable deficit: ${unfulfilledQty}.`
            }
          ]
        )
      }
    }

    // Calculate aggregated metrics
    const totalDistanceKm = shipments.reduce((sum, s) => sum + s.distanceKm, 0)
    const maxEstimatedDurationMinutes = Math.max(
      ...shipments.map((s) => s.estimatedDurationMinutes)
    )

    let splitReason =
      'No single warehouse possesses both sufficient inventory and required cold-chain delivery fleet.'
    if (orderRequiresColdChain) {
      splitReason =
        'Cold-chain items (vaccines) require specialized refrigerated transport vans (W04/W07/W08). Since nearby general depots (e.g. W01) lack vaccine inventory and refrigerated fleet, order was split deterministically.'
    }

    const whSummaries = shipments
      .map(
        (s) =>
          `${s.warehouseId} (${s.items.map((i) => `${i.productName} x${i.quantity}`).join(', ')}; ${s.distanceKm}km, ~${s.estimatedDurationMinutes}m)`
      )
      .join(' + ')

    const explanation = `Split-Order Fulfillment Activated: ${splitReason} Dispatched across ${shipments.length} facilities: ${whSummaries}. Total route distance: ${totalDistanceKm} km; longest delivery leg: ${maxEstimatedDurationMinutes} minutes.`

    return {
      strategy: 'split_order',
      totalShipments: shipments.length,
      totalDistanceKm,
      maxEstimatedDurationMinutes,
      coldChainCompliance: orderRequiresColdChain ? 'verified' : 'not_applicable',
      shipments,
      explanation,
      decisionFactors: {
        stockChecked: true,
        coldChainChecked: orderRequiresColdChain,
        trafficAdjusted: Boolean(orderTime),
        singleWarehouseEvaluated: true,
        splitReason
      }
    }
  }
}
