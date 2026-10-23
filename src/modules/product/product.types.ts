export interface Product {
  id: string
  name: string
  category: string
  coldChainRequired: boolean
  description?: string
}

export interface RawProductRow {
  id: string
  name: string
  category: string
  cold_chain_required: number
  description: string | null
}

export function mapProductRow(row: RawProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    coldChainRequired: Boolean(row.cold_chain_required),
    description: row.description || undefined
  }
}
