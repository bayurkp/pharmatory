import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { config } from '../config/app.config.js'
import { runMigrations } from './migrator.js'
import { runSeeders } from './seeder.js'

let dbInstance: Database.Database | null = null

export function getDatabase(dbPath = config.dbPath): Database.Database {
  if (!dbInstance) {
    if (dbPath !== ':memory:') {
      const dir = path.dirname(dbPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    }

    dbInstance = new Database(dbPath)
    dbInstance.pragma('journal_mode = WAL')
    dbInstance.pragma('foreign_keys = ON')

    initDatabase(dbInstance)
  }
  return dbInstance
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}

/**
 * Initializes database by applying any pending migrations and executing seeders.
 */
export function initDatabase(db: Database.Database): void {
  runMigrations(db)
  runSeeders(db)
}
