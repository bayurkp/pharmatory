import type Database from 'better-sqlite3'

export const name = '001_initial_medical_data'

export function seed(db: Database.Database): void {
  // 1. Seed Initial Products if empty
  const productCount = (
    db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number }
  ).count

  if (productCount === 0) {
    const insertProduct = db.prepare(`
      INSERT INTO products (id, name, category, cold_chain_required, description)
      VALUES (?, ?, ?, ?, ?)
    `)

    const initialProducts = [
      [
        'P001',
        'Surgical Gloves (Box of 100)',
        'Medical Supplies',
        0,
        'Standard ambient medical examination gloves'
      ],
      [
        'P002',
        'Vaccine — Hepatitis B (10-dose vial)',
        'Pharmaceutical',
        1,
        'Temperature-sensitive vaccine strictly requiring 2°C to 8°C cold chain'
      ],
      [
        'P003',
        'Disposable Syringe (Box of 50)',
        'Medical Supplies',
        0,
        'Sterile single-use medical syringes'
      ],
      [
        'P004',
        'Vaccine — Tetanus Toxoid (10-dose vial)',
        'Pharmaceutical',
        1,
        'Temperature-sensitive vaccine strictly requiring 2°C to 8°C cold chain'
      ],
      [
        'P005',
        'Paracetamol Tablets (Box of 100)',
        'Pharmaceutical',
        0,
        'Standard ambient oral analgesic and antipyretic medication'
      ]
    ]

    const seedProducts = db.transaction(() => {
      for (const p of initialProducts) {
        insertProduct.run(p[0], p[1], p[2], p[3], p[4])
      }
    })
    seedProducts()
  }

  // 2. Seed Initial Warehouses & Stock if empty
  const warehouseCount = (
    db.prepare('SELECT COUNT(*) as count FROM warehouses').get() as { count: number }
  ).count

  if (warehouseCount === 0) {
    const insertWarehouse = db.prepare(`
      INSERT INTO warehouses (id, name, location, distance_km, storage_type, fleet_type, full_cold_chain_capable)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const initialWarehouses = [
      ['W01', 'Surabaya Central Depot', 'Surabaya', 5.0, 'General Storage', 'Standard Vehicles', 0],
      [
        'W02',
        'Surabaya Cold Logistics',
        'Surabaya',
        12.0,
        'Refrigerated Unit',
        'Standard Vehicles',
        0
      ],
      [
        'W03',
        'Sidoarjo Distribution Hub',
        'Sidoarjo',
        25.0,
        'General Storage',
        'Standard Vehicles',
        0
      ],
      [
        'W04',
        'Gresik Cold Chain Express',
        'Gresik',
        30.0,
        'Refrigerated Unit',
        'Refrigerated Vans',
        1
      ],
      [
        'W05',
        'Malang Regional Terminal',
        'Malang',
        90.0,
        'General Storage',
        'Standard Vehicles',
        0
      ],
      ['W06', 'Malang Cold Facility', 'Malang', 95.0, 'Refrigerated Unit', 'Standard Vehicles', 0],
      ['W07', 'Pasuruan Pharma Hub', 'Pasuruan', 45.0, 'Refrigerated Unit', 'Refrigerated Vans', 1],
      ['W08', 'Jember Eastern Depot', 'Jember', 150.0, 'Refrigerated Unit', 'Refrigerated Vans', 1]
    ]

    const insertStock = db.prepare(`
      INSERT INTO warehouse_stocks (warehouse_id, product_id, quantity)
      VALUES (?, ?, ?)
    `)

    const initialStocks = [
      // W01: P001: 200, P003: 500, P005: 300
      ['W01', 'P001', 200],
      ['W01', 'P003', 500],
      ['W01', 'P005', 300],

      // W02: P001: 50, P002: 30, P004: 20
      ['W02', 'P001', 50],
      ['W02', 'P002', 30],
      ['W02', 'P004', 20],

      // W03: P001: 300, P003: 200
      ['W03', 'P001', 300],
      ['W03', 'P003', 200],

      // W04: P002: 40, P004: 25, P005: 100
      ['W04', 'P002', 40],
      ['W04', 'P004', 25],
      ['W04', 'P005', 100],

      // W05: P001: 400, P003: 300, P005: 500
      ['W05', 'P001', 400],
      ['W05', 'P003', 300],
      ['W05', 'P005', 500],

      // W06: P002: 20, P004: 30, P003: 100
      ['W06', 'P002', 20],
      ['W06', 'P004', 30],
      ['W06', 'P003', 100],

      // W07: P001: 150, P002: 8, P004: 10
      ['W07', 'P001', 150],
      ['W07', 'P002', 8],
      ['W07', 'P004', 10],

      // W08: P002: 60, P004: 50, P005: 200
      ['W08', 'P002', 60],
      ['W08', 'P004', 50],
      ['W08', 'P005', 200]
    ]

    const seedWarehouses = db.transaction(() => {
      for (const w of initialWarehouses) {
        insertWarehouse.run(w[0], w[1], w[2], w[3], w[4], w[5], w[6])
      }
      for (const s of initialStocks) {
        insertStock.run(s[0], s[1], s[2])
      }
    })
    seedWarehouses()
  }
}
