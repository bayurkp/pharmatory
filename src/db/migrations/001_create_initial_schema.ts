import type Database from 'better-sqlite3'

export const name = '001_create_initial_schema'

export function up(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      requires_cold_chain INTEGER NOT NULL DEFAULT 0,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS warehouses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      distance_km REAL NOT NULL,
      storage_type TEXT NOT NULL,
      fleet_type TEXT NOT NULL,
      is_cold_chain_capable INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS warehouse_stocks (
      warehouse_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (warehouse_id, product_id),
      FOREIGN KEY (warehouse_id) REFERENCES warehouses (id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    );
  `)
}

export function down(db: Database.Database): void {
  db.exec(`
    DROP TABLE IF EXISTS warehouse_stocks;
    DROP TABLE IF EXISTS warehouses;
    DROP TABLE IF EXISTS products;
  `)
}
