import { buildByJsonSuccessSchema, buildByJsonErrorSchema } from '../../shared/utils/by-json.util.js'

export const getTrafficPatternsSchema = {
  tags: ['Traffic Analytics'],
  summary: 'Retrieve historical delivery traffic analytics',
  description: 'Returns aggregated delivery duration statistics and empirical records processed in memory across regional routes.',
  response: {
    200: buildByJsonSuccessSchema({
      type: 'object',
      properties: {
        summary: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              warehouseId: { type: 'string' },
              sampleCount: { type: 'integer' },
              averageDurationMinutes: { type: 'number' },
              minDurationMinutes: { type: 'number' },
              maxDurationMinutes: { type: 'number' },
              congestedAvgMinutes: { type: 'number' },
              offPeakAvgMinutes: { type: 'number' }
            }
          }
        },
        records: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              deliveryId: { type: 'string' },
              warehouseId: { type: 'string' },
              dayOfWeek: { type: 'string' },
              timeString: { type: 'string' },
              actualDurationMinutes: { type: 'number' },
              notes: { type: 'string', nullable: true }
            }
          }
        }
      }
    }, 'Traffic analytics successfully retrieved'),
    500: buildByJsonErrorSchema('Internal server error')
  }
}

export const uploadTrafficCsvSchema = {
  tags: ['Traffic Analytics'],
  summary: 'Upload custom traffic delivery CSV (in-memory execution)',
  description: 'Streams and parses a custom historical CSV dataset entirely in memory without writing to disk. Dynamically updates routing and congestion duration models.',
  response: {
    200: buildByJsonSuccessSchema({
      type: 'object',
      properties: {
        filename: { type: 'string' },
        processedRecords: { type: 'integer' },
        summary: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              warehouseId: { type: 'string' },
              sampleCount: { type: 'integer' },
              averageDurationMinutes: { type: 'number' }
            }
          }
        }
      }
    }, 'Custom CSV parsed and loaded into memory successfully'),
    400: buildByJsonErrorSchema('Invalid CSV or empty file payload'),
    500: buildByJsonErrorSchema('Internal server error')
  }
}

export const resetTrafficSchema = {
  tags: ['Traffic Analytics'],
  summary: 'Reset traffic dataset to default benchmark',
  description: 'Re-initializes in-memory traffic duration indices back to default historical records.',
  response: {
    200: buildByJsonSuccessSchema({
      type: 'object',
      properties: {
        message: { type: 'string' },
        recordCount: { type: 'integer' }
      }
    }, 'Traffic models reset successfully')
  }
}
