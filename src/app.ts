import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify'
import crypto from 'node:crypto'
import fastifyMultipart from '@fastify/multipart'
import fastifyHelmet from '@fastify/helmet'
import fastifyRateLimit from '@fastify/rate-limit'
import errorHandlerPlugin from './plugins/error-handler.plugin.js'
import swaggerPlugin from './plugins/swagger.plugin.js'
import staticPlugin from './plugins/static.plugin.js'
import { productRoutes } from './modules/product/product.routes.js'
import { warehouseRoutes } from './modules/warehouse/warehouse.routes.js'
import { trafficRoutes } from './modules/traffic/traffic.routes.js'
import { fulfillmentRoutes } from './modules/fulfillment/fulfillment.routes.js'
import { byJsonSuccess, byJsonError } from './shared/utils/by-json.util.js'
import { getDatabase } from './db/connection.js'
import { getTrafficService } from './modules/traffic/traffic.service.js'

export async function buildApp(opts: FastifyServerOptions = {}): Promise<FastifyInstance> {
  const app: FastifyInstance = Fastify({
    logger: opts.logger ?? true,
    genReqId: () => crypto.randomUUID(),
    connectionTimeout: 10000,
    keepAliveTimeout: 5000,
    requestTimeout: 15000,
    ajv: {
      customOptions: {
        strict: false
      }
    },
    ...opts
  })

  // Initialize database schema and seed data
  getDatabase()

  // Pre-initialize traffic historical analytics
  const trafficService = getTrafficService()
  await trafficService.initialize()

  // 1. Security Headers (Helmet)
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false, // Prevents blocking inline UI Alpine evaluation & Scalar API docs
    crossOriginEmbedderPolicy: false
  })

  // 2. Rate Limiting (100 req/min for APIs, excluded in test mode)
  await app.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute',
    allowList: (req) => {
      return (
        req.url.startsWith('/public') ||
        req.url.startsWith('/docs') ||
        req.url === '/' ||
        process.env.NODE_ENV === 'test'
      )
    },
    errorResponseBuilder: (request, context) => {
      return byJsonError(
        'rate_limit_exceeded',
        `Rate limit exceeded. You can make up to ${context.max} requests per ${context.after}. Please retry shortly.`,
        request.id as string
      )
    }
  })

  // 3. Register multipart plugin for in-memory file uploads
  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB limit
      files: 1
    }
  })

  // 2. Register global plugins
  await app.register(errorHandlerPlugin)
  await app.register(swaggerPlugin)
  await app.register(staticPlugin)

  // 3. Health check route conforming to ByJSON v2.0
  app.get(
    '/api/health',
    {
      schema: {
        tags: ['Health'],
        summary: 'System health check',
        description: 'Checks operational readiness of the Pharmatory engine.'
      }
    },
    async (request, reply) => {
      return reply.status(200).send(
        byJsonSuccess(
          {
            status: 'healthy',
            service: 'pharmatory-fulfillment-engine',
            timestamp: new Date().toISOString()
          },
          request.id as string
        )
      )
    }
  )

  // 4. Register feature domain modules under /api/v1 prefix
  await app.register(productRoutes, { prefix: '/api/v1/products' })
  await app.register(warehouseRoutes, { prefix: '/api/v1/warehouses' })
  await app.register(trafficRoutes, { prefix: '/api/v1/traffic' })
  // Support both Process Endpoint (/api/v1/orders/fulfill) and Resource Endpoint (/api/v1/fulfillments)
  await app.register(fulfillmentRoutes, { prefix: '/api/v1/orders' })
  await app.register(fulfillmentRoutes, { prefix: '/api/v1/fulfillments' })

  return app
}
