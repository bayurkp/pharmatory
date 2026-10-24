import { getDatabase } from './connection.js'
import * as migration001 from './migrations/001_create_initial_schema.js'
import { runMigrations } from './migrator.js'
import { runSeeders } from './seeder.js'

export function resetDatabase(): void {
  const db = getDatabase()
  console.log('[DB Reset] Rolling back schema...')

  // Drop tables
  migration001.down(db)
  db.exec('DROP TABLE IF EXISTS _migrations;')

  console.log('[DB Reset] Running fresh migrations...')
  const { applied } = runMigrations(db)
  console.log(`[DB Reset] Applied ${applied.length} migration(s):`, applied.join(', '))

  console.log('[DB Reset] Seeding initial data...')
  const { seeded } = runSeeders(db)
  console.log(`[DB Reset] Seeded:`, seeded.join(', '))

  console.log('[DB Reset] Database successfully reset and seeded!')
}

if (
  process.argv[1] &&
  (process.argv[1].endsWith('reset.ts') || process.argv[1].endsWith('reset.js'))
) {
  resetDatabase()
}

