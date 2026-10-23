import Fastify, { FastifyInstance, FastifyError } from 'fastify'
import fastifyStatic from '@fastify/static'
import fastifySwagger from '@fastify/swagger'
import scalarApiReference from '@scalar/fastify-api-reference'
import path from 'node:path'
import crypto from 'node:crypto'
import {
  byJsonSuccess,
  byJsonError,
  buildByJsonSuccessSchema,
  buildByJsonErrorSchema,
  ByJsonErrorDetail
} from './utils/by-json.js'

const fastify: FastifyInstance = Fastify({
  logger: true,
  genReqId: () => crypto.randomUUID(),
  ajv: {
    customOptions: {
      strict: false
    }
  }
})

// Global Error Handler conforming to ByJSON Specification v2.0
fastify.setErrorHandler((error: FastifyError, request, reply) => {
  const requestId = (request.id as string) || crypto.randomUUID()

  // Handle Schema Validation Errors (HTTP 422 Unprocessable Content)
  if (error.validation) {
    const details: ByJsonErrorDetail[] = error.validation.map((v) => {
      const field = v.instancePath
        ? v.instancePath.replace(/^\//, '').replace(/\//g, '.')
        : ((v.params as Record<string, unknown>)?.missingProperty as string) || 'body'
      const code = v.keyword === 'required' ? 'missing_field' : v.keyword || 'invalid_format'
      return {
        field,
        code,
        message: v.message || 'Field validation failed'
      }
    })

    reply.status(422)
    return byJsonError(
      'validation_error',
      'The request data is invalid. Please check your input.',
      requestId,
      details
    )
  }

  // Handle generic HTTP errors
  const statusCode = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500
  const errorCode = statusCode === 400 ? 'bad_request' : 'internal_error'

  reply.status(statusCode)
  return byJsonError(
    errorCode,
    error.message || 'An unexpected server error occurred.',
    requestId
  )
})

// Custom 404 Handler conforming to ByJSON Specification v2.0
fastify.setNotFoundHandler((request, reply) => {
  const requestId = (request.id as string) || crypto.randomUUID()

  if (request.url.startsWith('/api/')) {
    reply.status(404)
    return byJsonError(
      'not_found',
      `The requested endpoint '${request.method} ${request.url}' was not found.`,
      requestId
    )
  }

  reply.status(404).send('Not Found')
})

// In-memory data store for demonstration
interface Medicine {
  id: number
  name: string
  category: string
  stock: number
  price: number
}

const medicines: Medicine[] = [
  { id: 1, name: 'Paracetamol 500mg', category: 'Analgesik', stock: 120, price: 15000 },
  { id: 2, name: 'Amoxicillin 500mg', category: 'Antibiotik', stock: 45, price: 25000 },
  { id: 3, name: 'Cetirizine 10mg', category: 'Antihistamin', stock: 80, price: 18000 }
]

// 1. Register Swagger (OpenAPI 3.1 generator)
await fastify.register(fastifySwagger, {
  openapi: {
    openapi: '3.1.0',
    info: {
      title: 'Pharmatory API',
      description: 'API Documentation for Pharmatory Pharmaceutical System (Conforming to ByJSON v2.0 Standard: https://github.com/bayurkp/by-json)',
      version: '1.0.0'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development Server'
      }
    ],
    tags: [
      { name: 'System', description: 'System health and status endpoints' },
      { name: 'Medicines', description: 'Pharmacy medicine inventory management' }
    ]
  }
})

// 2. Register Scalar API Reference at /docs/v1
await fastify.register(scalarApiReference, {
  routePrefix: '/docs/v1',
  configuration: {
    theme: 'fastify'
  }
})

// 3. Register static file serving from public/
await fastify.register(fastifyStatic, {
  root: path.join(process.cwd(), 'public'),
  prefix: '/',
  index: ['index.html']
})

// 4. OpenAPI Specification Endpoints (Raw JSON)
fastify.get('/api/v1/openapi', { schema: { hide: true } }, async () => {
  return fastify.swagger()
})

// 5. Convenience Redirects
fastify.get('/docs', { schema: { hide: true } }, async (request, reply) => {
  return reply.redirect('/docs/v1')
})
fastify.get('/api/v1/docs', { schema: { hide: true } }, async (request, reply) => {
  return reply.redirect('/docs/v1')
})

// --- API Routes with Schemas for Scalar Documentation (ByJSON v2.0 Envelope) ---

const healthDataSchema = {
  type: 'object',
  properties: {
    status: { type: 'string', example: 'healthy' },
    timestamp: { type: 'string', format: 'date-time' }
  }
}

const medicineItemSchema = {
  type: 'object',
  properties: {
    id: { type: 'number', example: 1 },
    name: { type: 'string', example: 'Paracetamol 500mg' },
    category: { type: 'string', example: 'Analgesik' },
    stock: { type: 'number', example: 120 },
    price: { type: 'number', example: 15000 }
  }
}

const medicinesListDataSchema = {
  type: 'array',
  items: medicineItemSchema
}

const healthSchema = {
  tags: ['System'],
  summary: 'Health Check',
  description: 'Returns the health status and current timestamp in ByJSON v2.0 format',
  response: {
    200: buildByJsonSuccessSchema(healthDataSchema)
  }
}

const getMedicinesSchema = {
  tags: ['Medicines'],
  summary: 'Get All Medicines',
  description: 'Retrieves the complete list of medicines currently in stock in ByJSON v2.0 format',
  response: {
    200: buildByJsonSuccessSchema(medicinesListDataSchema)
  }
}

const postMedicineSchema = {
  tags: ['Medicines'],
  summary: 'Create Medicine',
  description: 'Adds a new medicine item to the inventory (ByJSON v2.0 format)',
  body: {
    type: 'object',
    required: ['name', 'category', 'stock', 'price'],
    properties: {
      name: { type: 'string', example: 'Ibuprofen 400mg' },
      category: { type: 'string', example: 'Analgesik / NSAID' },
      stock: { type: 'number', example: 50 },
      price: { type: 'number', example: 22000 }
    }
  },
  response: {
    201: buildByJsonSuccessSchema(medicineItemSchema),
    422: buildByJsonErrorSchema('validation_error', 'The request data is invalid. Please check your input.')
  }
}

// Health check routes
fastify.get('/api/health', { schema: healthSchema }, async (request) => {
  return byJsonSuccess(
    { status: 'healthy', timestamp: new Date().toISOString() },
    request.id as string
  )
})
fastify.get('/api/v1/health', { schema: { ...healthSchema, hide: true } }, async (request) => {
  return byJsonSuccess(
    { status: 'healthy', timestamp: new Date().toISOString() },
    request.id as string
  )
})

// Medicines routes
fastify.get('/api/v1/medicines', { schema: getMedicinesSchema }, async (request) => {
  return byJsonSuccess(medicines, request.id as string)
})
fastify.get('/api/medicines', { schema: { ...getMedicinesSchema, hide: true } }, async (request) => {
  return byJsonSuccess(medicines, request.id as string)
})

fastify.post<{
  Body: { name: string; category: string; stock: number; price: number }
}>('/api/v1/medicines', { schema: postMedicineSchema }, async (request, reply) => {
  const { name, category, stock, price } = request.body
  const newMedicine: Medicine = {
    id: Date.now(),
    name,
    category,
    stock,
    price
  }
  medicines.push(newMedicine)
  reply.status(201)
  return byJsonSuccess(newMedicine, request.id as string)
})

fastify.post<{
  Body: { name: string; category: string; stock: number; price: number }
}>('/api/medicines', { schema: { ...postMedicineSchema, hide: true } }, async (request, reply) => {
  const { name, category, stock, price } = request.body
  const newMedicine: Medicine = {
    id: Date.now(),
    name,
    category,
    stock,
    price
  }
  medicines.push(newMedicine)
  reply.status(201)
  return byJsonSuccess(newMedicine, request.id as string)
})

const start = async (): Promise<void> => {
  try {
    const port = Number(process.env.PORT) || 3000
    await fastify.listen({ port, host: '0.0.0.0' })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
