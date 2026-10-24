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
    'fullColdChainCapable'
  ],
  properties: {
    id: { type: 'string', example: 'W04' },
    name: { type: 'string', example: 'Gresik Cold Chain Express' },
    location: { type: 'string', example: 'Gresik' },
    distanceKm: { type: 'number', example: 30.0 },
    storageType: { type: 'string', example: 'Refrigerated Unit' },
    fleetType: { type: 'string', example: 'Refrigerated Vans' },
    fullColdChainCapable: { type: 'boolean', example: true },
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
          category: { type: 'string' },
          coldChainRequired: { type: 'boolean' },
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
    'Returns the 8 regional medical warehouses across East Java with location, storage capabilities, vehicle fleet types, and real-time inventory balances.',
  querystring: {
    type: 'object',
    properties: {
      city: { type: 'string', description: 'Filter warehouses by city (e.g. Surabaya, Malang)' },
      location: { type: 'string', description: 'Alternative alias for city' },
      coldChain: {
        type: 'boolean',
        description: 'Filter warehouses by full cold-chain capability (true/false)'
      },
      cold_chain: { type: 'boolean', description: 'Alternative snake_case alias' },
      fullColdChainCapable: { type: 'boolean', description: 'Legacy verbose alias' }
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
