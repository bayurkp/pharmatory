import type Database from 'better-sqlite3'
import { getDatabase } from './connection.js'
import * as seed001 from './seeds/001_initial_medical_data.js'

export interface Seeder {
  name: string
  seed: (db: Database.Database) => void
}

const ALL_SEEDERS: Seeder[] = [seed001]

export function runSeeders(db: Database.Database): { seeded: string[] } {
  const seeded: string[] = []

  for (const s of ALL_SEEDERS) {
    s.seed(db)
    seeded.push(s.name)
  }

  return { seeded }
}

// CLI runner: executes when invoked directly via tsx/node
if (
  process.argv[1] &&
  (process.argv[1].endsWith('seeder.ts') || process.argv[1].endsWith('seeder.js'))
) {
  const db = getDatabase()
  const { seeded } = runSeeders(db)
  console.log(`[Seeders] Executed ${seeded.length} seeder(s):`, seeded.join(', '))
}
