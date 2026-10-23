import { buildByJsonSuccessSchema, buildByJsonErrorSchema } from '../../shared/utils/by-json.util.js'

export const productItemSchema = {
  type: 'object',
  required: ['id', 'name', 'category', 'coldChainRequired'],
  properties: {
    id: { type: 'string', example: 'P001' },
    name: { type: 'string', example: 'Surgical Gloves (Box of 100)' },
    category: { type: 'string', example: 'Medical Supplies' },
    coldChainRequired: { type: 'boolean', example: false },
    description: { type: 'string', nullable: true, example: 'Standard ambient medical examination gloves' }
  }
}

export const getProductsSchema = {
  tags: ['Products'],
  summary: 'Retrieve all catalog products',
  description: 'Returns the complete pharmaceutical and medical product catalog, indicating cold chain storage requirements.',
  querystring: {
    type: 'object',
    properties: {
      category: { type: 'string', description: 'Filter products by category' },
      coldChain: { type: 'boolean', description: 'Filter products by cold chain requirement (true/false)' },
      cold_chain: { type: 'boolean', description: 'Alternative snake_case alias' },
      coldChainRequired: { type: 'boolean', description: 'Legacy verbose alias' }
    }
  },
  response: {
    200: buildByJsonSuccessSchema({
      type: 'array',
      items: productItemSchema
    }, 'Product catalog successfully retrieved'),
    500: buildByJsonErrorSchema('Internal server error')
  }
}
