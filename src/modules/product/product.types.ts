export const ProductCategory = {
  MEDICAL_SUPPLIES: 'medical_supplies',
  PHARMACEUTICAL: 'pharmaceutical'
} as const

export type ProductCategory = (typeof ProductCategory)[keyof typeof ProductCategory]

export const ProductCategoryLabels: Record<ProductCategory, string> = {
  [ProductCategory.MEDICAL_SUPPLIES]: 'Medical Supplies',
  [ProductCategory.PHARMACEUTICAL]: 'Pharmaceutical'
}

export interface Product {
  id: string
  name: string
  category: ProductCategory
  requiresColdChain: boolean
  description?: string
}

export interface RawProductRow {
  id: string
  name: string
  category: string
  requires_cold_chain: number
  description: string | null
}

export function mapProductRow(row: RawProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category as ProductCategory,
    requiresColdChain: Boolean(row.requires_cold_chain),
    description: row.description || undefined
  }
}
