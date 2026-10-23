import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import fastifySwagger from '@fastify/swagger'
import scalarApiReference from '@scalar/fastify-api-reference'

const swaggerPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(fastifySwagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'Pharmatory Fulfillment & Logistics Engine API',
        description: 'Production-grade medical warehouse selection and order fulfillment engine adhering strictly to ByJSON Specification v2.0, cold-chain regulatory compliance, and historical traffic analytics.',
        version: '1.0.0',
        contact: {
          name: 'Pharmatory Logistics Engineering Team',
          email: 'engineering@pharmatory.local'
        }
      },
      tags: [
        { name: 'Order Fulfillment', description: 'Deterministic warehouse selection and order splitting solver' },
        { name: 'Products', description: 'Pharmaceutical and medical catalog management' },
        { name: 'Warehouses', description: 'Regional facility registry and live inventory balances' },
        { name: 'Traffic Analytics', description: 'Empirical delivery duration models and congestion analytics' }
      ]
    }
  })

  // Mount Scalar API documentation at /docs/v1
  await fastify.register(scalarApiReference, {
    routePrefix: '/docs/v1',
    configuration: {
      theme: 'purple',
      layout: 'modern',
      showSidebar: true
    }
  })

  // Top-level redirect /docs -> /docs/v1
  fastify.get('/docs', async (request, reply) => {
    return reply.redirect('/docs/v1', 302)
  })

  // OpenAPI contract JSON alias
  fastify.get('/api/v1/openapi', async (request, reply) => {
    return reply.status(200).send(fastify.swagger())
  })
}

export default fp(swaggerPlugin, { name: 'swagger-docs' })
