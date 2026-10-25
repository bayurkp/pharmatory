import { FastifyInstance } from 'fastify'
import { getTrafficService } from './traffic.service.js'
import { TrafficController } from './traffic.controller.js'
import {
  getTrafficPatternsSchema,
  uploadTrafficCsvSchema,
  resetTrafficSchema
} from './traffic.schema.js'

export async function trafficRoutes(fastify: FastifyInstance): Promise<void> {
  const trafficService = getTrafficService()
  const trafficController = new TrafficController(trafficService)

  // Traffic analytics endpoint returning aggregated summary & trip records
  fastify.get(
    '/patterns',
    { schema: getTrafficPatternsSchema },
    trafficController.getTrafficPatterns
  )

  // Process endpoints (ByJSON v2.0 Section 3.2)
  fastify.post('/upload', { schema: uploadTrafficCsvSchema }, trafficController.uploadTrafficCsv)
  fastify.post('/reset', { schema: resetTrafficSchema }, trafficController.resetTraffic)
}
