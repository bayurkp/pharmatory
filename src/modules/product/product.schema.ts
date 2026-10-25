import {
  buildByJsonSuccessSchema,
  buildByJsonErrorSchema
} from '../../shared/utils/by-json.util.js'

export const productItemSchema = {
  type: 'object',
  required: ['id', 'name', 'category', 'requiresColdChain'],
  properties: {
    id: { type: 'string', example: 'P001' },
    name: { type: 'string', example: 'Surgical Gloves (Box of 100)' },
    category: {
      type: 'string',
      enum: ['medical_supplies', 'pharmaceutical'],
      example: 'medical_supplies'
    },
    requiresColdChain: { type: 'boolean', example: false },
    description: {
      type: 'string',
      nullable: true,
      example: 'Standard ambient medical examination gloves'
    }
  }
}

export const getProductsSchema = {
  tags: ['Products'],
  summary: 'Retrieve all catalog products',
  description:
    'Returns the complete pharmaceutical and medical product catalog with normalized category enums and cold chain predicate.',
  querystring: {
    type: 'object',
    properties: {
      sort: {
        anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
        description:
          'ByJSON v2.0 multi-field sort (e.g. sort=-requiresColdChain&sort=+name or sort=-requiresColdChain,+name)'
      },
      category: {
        type: 'string',
        enum: ['medical_supplies', 'pharmaceutical'],
        description: 'Filter products by category'
      },
      'category.in': {
        anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
        description: 'ByJSON repeated key filter for multiple categories'
      },
      search: {
        type: 'string',
        description: 'Search products by SKU ID, name, or clinical description'
      },
      requiresColdChain: {
        type: 'boolean',
        description: 'Filter products by cold chain requirement (true/false)'
      },
      coldChain: {
        type: 'boolean',
        description: 'Convenience query parameter alias'
      }
    }
  },
  response: {
    200: buildByJsonSuccessSchema(
      {
        type: 'array',
        items: productItemSchema
      },
      'Product catalog successfully retrieved'
    ),
    500: buildByJsonErrorSchema('Internal server error')
  }
}
