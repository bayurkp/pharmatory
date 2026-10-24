import type Database from 'better-sqlite3'
import { getDatabase } from './connection.js'
import * as migration001 from './migrations/001_create_initial_schema.js'

export interface Migration {
  name: string
  up: (db: Database.Database) => void
  down: (db: Database.Database) => void
}

const ALL_MIGRATIONS: Migration[] = [migration001]

export function runMigrations(db: Database.Database): { applied: string[]; skipped: string[] } {
  // Ensure _migrations tracking table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  const getApplied = db.prepare('SELECT name FROM _migrations').all() as { name: string }[]
  const appliedSet = new Set(getApplied.map((row) => row.name))

  const applied: string[] = []
  const skipped: string[] = []

  const recordMigration = db.prepare('INSERT INTO _migrations (name) VALUES (?)')

  for (const migration of ALL_MIGRATIONS) {
    if (appliedSet.has(migration.name)) {
      skipped.push(migration.name)
      continue
    }

    const executeMigration = db.transaction(() => {
      migration.up(db)
      recordMigration.run(migration.name)
    })

    executeMigration()
    applied.push(migration.name)
  }

  return { applied, skipped }
}

// CLI runner: executes when invoked directly via tsx/node
if (
  process.argv[1] &&
  (process.argv[1].endsWith('migrator.ts') || process.argv[1].endsWith('migrator.js'))
) {
  const db = getDatabase()
  const { applied, skipped } = runMigrations(db)
  if (applied.length > 0) {
    console.log(`[Migrations] Applied ${applied.length} migration(s):`, applied.join(', '))
  } else {
    console.log('[Migrations] All migrations are already up to date.')
  }
  if (skipped.length > 0) {
    console.log(`[Migrations] Skipped: ${skipped.join(', ')}`)
  }
}

