import {
  buildByJsonSuccessSchema,
  buildByJsonErrorSchema
} from '../../shared/utils/by-json.util.js'

export const warehouseItemSchema = {
  type: 'object',
  required: [
    'id',
    'name',
    'location',
    'distanceKm',
    'storageType',
    'fleetType',
    'isColdChainCapable'
  ],
  properties: {
    id: { type: 'string', example: 'W04' },
    name: { type: 'string', example: 'Gresik Cold Chain Express' },
    location: { type: 'string', example: 'Gresik' },
    distanceKm: { type: 'number', example: 30.0 },
    storageType: {
      type: 'string',
      enum: ['ambient', 'refrigerated'],
      example: 'refrigerated'
    },
    fleetType: {
      type: 'string',
      enum: ['standard', 'refrigerated'],
      example: 'refrigerated'
    },
    isColdChainCapable: { type: 'boolean', example: true },
    stocks: {
      type: 'object',
      additionalProperties: { type: 'integer' },
      example: { P002: 40, P004: 25, P005: 100 }
    },
    inventory: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          productId: { type: 'string' },
          productName: { type: 'string' },
          category: {
            type: 'string',
            enum: ['medical_supplies', 'pharmaceutical']
          },
          requiresColdChain: { type: 'boolean' },
          quantity: { type: 'integer' }
        }
      }
    }
  }
}

export const getWarehousesSchema = {
  tags: ['Warehouses'],
  summary: 'Retrieve all regional warehouses',
  description:
    'Returns the 8 regional medical warehouses across East Java with normalized storage/fleet enums and cold chain predicate.',
  querystring: {
    type: 'object',
    properties: {
      city: { type: 'string', description: 'Filter warehouses by city (e.g. Surabaya, Malang)' },
      location: { type: 'string', description: 'Alternative alias for city' },
      search: { type: 'string', description: 'Search warehouses by ID, name, or city' },
      storageType: {
        type: 'string',
        enum: ['ambient', 'refrigerated'],
        description: 'Filter warehouses by storage type'
      },
      isColdChainCapable: {
        type: 'boolean',
        description: 'Filter warehouses by full cold-chain capability (true/false)'
      },
      is_cold_chain_capable: {
        type: 'boolean',
        description: 'Filter warehouses by full cold-chain capability (snake_case alias)'
      },
      coldChain: {
        type: 'boolean',
        description: 'Convenience query parameter alias'
      },
      cold_chain: { type: 'boolean', description: 'Convenience query parameter snake_case alias' }
    }
  },
  response: {
    200: buildByJsonSuccessSchema(
      {
        type: 'array',
        items: warehouseItemSchema
      },
      'Warehouses list successfully retrieved'
    ),
    500: buildByJsonErrorSchema('Internal server error')
  }
}
