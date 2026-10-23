import { buildByJsonSuccessSchema, buildByJsonErrorSchema } from '../../shared/utils/by-json.util.js'

export const fulfillOrderBodySchema = {
  type: 'object',
  required: ['items'],
  properties: {
    items: {
      type: 'array',
      minItems: 1,
      description: 'List of order items specifying product IDs and positive integer quantities.',
      items: {
        type: 'object',
        required: ['productId', 'quantity'],
        properties: {
          productId: { type: 'string', example: 'P001' },
          quantity: { type: 'integer', minimum: 1, example: 50 }
        }
      }
    },
    orderTime: {
      type: 'string',
      description: 'Optional dispatch timestamp or day/time string (e.g. "Mon, 08:00" or ISO-8601) to evaluate rush-hour traffic heuristics.',
      example: 'Mon, 08:00'
    },
    customerLocation: {
      type: 'string',
      description: 'Optional destination label (defaults to primary healthcare facility).',
      example: 'Surabaya Central Hospital'
    }
  }
}

export const fulfillOrderResponseDataSchema = {
  type: 'object',
  properties: {
    strategy: { type: 'string', enum: ['single_warehouse', 'split_order'] },
    totalShipments: { type: 'integer' },
    totalDistanceKm: { type: 'number' },
    maxEstimatedDurationMinutes: { type: 'number' },
    coldChainCompliance: { type: 'string', enum: ['verified', 'not_applicable', 'warning'] },
    shipments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          warehouseId: { type: 'string' },
          warehouseName: { type: 'string' },
          location: { type: 'string' },
          distanceKm: { type: 'number' },
          storageType: { type: 'string' },
          fleetType: { type: 'string' },
          fullColdChainCapable: { type: 'boolean' },
          estimatedDurationMinutes: { type: 'number' },
          trafficDetails: {
            type: 'object',
            properties: {
              warehouseId: { type: 'string' },
              estimatedDurationMinutes: { type: 'number' },
              isPeakHour: { type: 'boolean' },
              isWeekendCongestion: { type: 'boolean' },
              congestionFactor: { type: 'number' },
              appliedRationale: { type: 'string' }
            }
          },
          items: {
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
    },
    explanation: { type: 'string' },
    decisionFactors: {
      type: 'object',
      properties: {
        stockChecked: { type: 'boolean' },
        coldChainChecked: { type: 'boolean' },
        trafficAdjusted: { type: 'boolean' },
        singleWarehouseEvaluated: { type: 'boolean' },
        splitReason: { type: 'string' }
      }
    }
  }
}

export const fulfillOrderSchema = {
  tags: ['Order Fulfillment'],
  summary: 'Evaluate warehouse selection and order fulfillment plan',
  description: 'Deterministic fulfillment engine evaluating stock availability, cold-chain delivery compliance (refrigerated fleet), road distance, and empirical traffic congestion patterns. Generates a transparent decision rationale and ByJSON v2.0 response.',
  body: fulfillOrderBodySchema,
  response: {
    200: buildByJsonSuccessSchema(fulfillOrderResponseDataSchema, 'Fulfillment plan generated successfully'),
    400: buildByJsonErrorSchema('Bad request or inventory deficit'),
    422: buildByJsonErrorSchema('Schema validation error'),
    500: buildByJsonErrorSchema('Internal server error')
  }
}
