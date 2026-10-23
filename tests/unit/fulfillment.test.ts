import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { FulfillmentEngine } from '../../src/modules/fulfillment/fulfillment.engine.js'
import { TrafficService } from '../../src/modules/traffic/traffic.service.js'
import { Product } from '../../src/modules/product/product.types.js'
import { Warehouse } from '../../src/modules/warehouse/warehouse.types.js'
import { ValidationError } from '../../src/shared/errors/app-error.js'

describe('FulfillmentEngine Unit Tests', () => {
  let trafficService: TrafficService
  let engine: FulfillmentEngine

  const mockProducts: Product[] = [
    { id: 'P001', name: 'Surgical Gloves', category: 'Medical Supplies', coldChainRequired: false },
    { id: 'P002', name: 'Vaccine — Hepatitis B', category: 'Pharmaceutical', coldChainRequired: true },
    { id: 'P003', name: 'Disposable Syringe', category: 'Medical Supplies', coldChainRequired: false },
    { id: 'P004', name: 'Vaccine — Tetanus Toxoid', category: 'Pharmaceutical', coldChainRequired: true },
    { id: 'P005', name: 'Paracetamol Tablets', category: 'Pharmaceutical', coldChainRequired: false }
  ]

  const mockWarehouses: Warehouse[] = [
    {
      id: 'W01',
      name: 'Surabaya Central Depot',
      location: 'Surabaya',
      distanceKm: 5.0,
      storageType: 'General Storage',
      fleetType: 'Standard Vehicles',
      fullColdChainCapable: false,
      stocks: { P001: 200, P003: 500, P005: 300 }
    },
    {
      id: 'W02',
      name: 'Surabaya Cold Logistics',
      location: 'Surabaya',
      distanceKm: 12.0,
      storageType: 'Refrigerated Unit',
      fleetType: 'Standard Vehicles',
      fullColdChainCapable: false, // Storage only, disqualified for vaccine delivery!
      stocks: { P001: 50, P002: 30, P004: 20 }
    },
    {
      id: 'W04',
      name: 'Gresik Cold Chain Express',
      location: 'Gresik',
      distanceKm: 30.0,
      storageType: 'Refrigerated Unit',
      fleetType: 'Refrigerated Vans',
      fullColdChainCapable: true,
      stocks: { P002: 40, P004: 25, P005: 100 }
    },
    {
      id: 'W07',
      name: 'Pasuruan Pharma Hub',
      location: 'Pasuruan',
      distanceKm: 45.0,
      storageType: 'Refrigerated Unit',
      fleetType: 'Refrigerated Vans',
      fullColdChainCapable: true,
      stocks: { P001: 150, P002: 8, P004: 10 }
    }
  ]

  before(async () => {
    trafficService = new TrafficService()
    await trafficService.initialize()
    engine = new FulfillmentEngine(trafficService)
  })

  it('selects closest single warehouse (W01) for ambient medical supplies when inventory is sufficient', () => {
    const orderItems = [
      { productId: 'P001', quantity: 50 },
      { productId: 'P003', quantity: 100 }
    ]

    const plan = engine.evaluate(orderItems, mockProducts, mockWarehouses)

    assert.equal(plan.strategy, 'single_warehouse')
    assert.equal(plan.totalShipments, 1)
    assert.equal(plan.shipments[0].warehouseId, 'W01')
    assert.equal(plan.shipments[0].distanceKm, 5.0)
    assert.equal(plan.coldChainCompliance, 'not_applicable')
    assert.match(plan.explanation, /W01/)
  })

  it('strictly enforces cold chain: disqualifies W02 (storage only) and routes vaccine to W04 (refrigerated fleet)', () => {
    const orderItems = [
      { productId: 'P002', quantity: 20 } // Vaccine Hepatitis B
    ]

    const plan = engine.evaluate(orderItems, mockProducts, mockWarehouses)

    assert.equal(plan.strategy, 'single_warehouse')
    assert.equal(plan.totalShipments, 1)
    // W02 is only 12km and has 30 stock, but lacks refrigerated vehicles.
    // W04 is 30km with refrigerated vans. The engine must select W04!
    assert.equal(plan.shipments[0].warehouseId, 'W04')
    assert.equal(plan.coldChainCompliance, 'verified')
    assert.equal(plan.shipments[0].fullColdChainCapable, true)
    assert.equal(plan.shipments[0].fleetType, 'Refrigerated Vans')
  })

  it('splits orders deterministically when items require mixed cold-chain fleet and ambient inventory', () => {
    const orderItems = [
      { productId: 'P001', quantity: 100 }, // Only available at W01, W02, W07
      { productId: 'P002', quantity: 15 }   // Vaccine: requires W04 or W07
    ]

    // W04 has P002 (40) but 0 P001.
    // W01 has P001 (200) but 0 P002.
    // W07 has P001 (150) and P002 (8) - P002 stock (8) is not enough for 15!
    // Therefore, no single warehouse can fulfill both! Must split!
    const plan = engine.evaluate(orderItems, mockProducts, mockWarehouses)

    assert.equal(plan.strategy, 'split_order')
    assert.equal(plan.coldChainCompliance, 'verified')
    assert.ok(plan.shipments.length >= 2)

    // Verify vaccine is dispatched from cold-chain facility
    const vaccineShipment = plan.shipments.find((s) => s.items.some((i) => i.productId === 'P002'))
    assert.ok(vaccineShipment)
    assert.equal(vaccineShipment?.fullColdChainCapable, true)
    assert.equal(vaccineShipment?.fleetType, 'Refrigerated Vans')
  })

  it('adjusts duration dynamically based on peak traffic heuristics', () => {
    const orderItems = [{ productId: 'P001', quantity: 20 }]

    const offPeakPlan = engine.evaluate(orderItems, mockProducts, mockWarehouses, 'Sun, 09:00')
    const peakPlan = engine.evaluate(orderItems, mockProducts, mockWarehouses, 'Mon, 08:00')

    assert.equal(offPeakPlan.shipments[0].warehouseId, 'W01')
    assert.equal(peakPlan.shipments[0].warehouseId, 'W01')
    // Morning peak at W01 is ~50 mins vs off-peak ~10 mins
    assert.ok(peakPlan.shipments[0].estimatedDurationMinutes > offPeakPlan.shipments[0].estimatedDurationMinutes)
  })

  it('throws ValidationError for empty order items or non-positive quantities', () => {
    assert.throws(
      () => engine.evaluate([], mockProducts, mockWarehouses),
      ValidationError
    )

    assert.throws(
      () => engine.evaluate([{ productId: 'P001', quantity: -10 }], mockProducts, mockWarehouses),
      ValidationError
    )
  })

  it('throws ValidationError with field detail for unknown product IDs', () => {
    assert.throws(
      () => engine.evaluate([{ productId: 'P999_UNKNOWN', quantity: 10 }], mockProducts, mockWarehouses),
      ValidationError
    )
  })
})
