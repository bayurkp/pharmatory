import Fastify, { FastifyInstance } from 'fastify'
import fastifyStatic from '@fastify/static'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import scalarApiReference from '@scalar/fastify-api-reference'
import path from 'node:path'

const fastify: FastifyInstance = Fastify({
  logger: true,
  ajv: {
    customOptions: {
      strict: false
    }
  }
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

// 1. Register Swagger (OpenAPI 3.1)
await fastify.register(fastifySwagger, {
  openapi: {
    openapi: '3.1.0',
    info: {
      title: 'Pharmatory API',
      description: 'API Documentation for Pharmatory Pharmaceutical System with Swagger & Scalar',
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

// 2. Register Swagger UI at /docs
await fastify.register(fastifySwaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: false
  }
})

// 3. Register Scalar API Reference at /scalar
await fastify.register(scalarApiReference, {
  routePrefix: '/scalar',
  configuration: {
    theme: 'fastify'
  }
})

// 4. Register static file serving from public/
await fastify.register(fastifyStatic, {
  root: path.join(process.cwd(), 'public'),
  prefix: '/',
  index: ['index.html']
})

// --- API Routes with Schemas for Swagger / Scalar ---

fastify.get(
  '/api/health',
  {
    schema: {
      tags: ['System'],
      summary: 'Health Check',
      description: 'Returns the health status and current timestamp of the server',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'healthy' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  },
  async () => {
    return { status: 'healthy', timestamp: new Date().toISOString() }
  }
)

fastify.get(
  '/api/medicines',
  {
    schema: {
      tags: ['Medicines'],
      summary: 'Get All Medicines',
      description: 'Retrieves the complete list of medicines currently in stock',
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              category: { type: 'string' },
              stock: { type: 'number' },
              price: { type: 'number' }
            }
          }
        }
      }
    }
  },
  async () => {
    return medicines
  }
)

fastify.post<{
  Body: { name: string; category: string; stock: number; price: number }
}>(
  '/api/medicines',
  {
    schema: {
      tags: ['Medicines'],
      summary: 'Create Medicine',
      description: 'Adds a new medicine item to the inventory',
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
        201: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            category: { type: 'string' },
            stock: { type: 'number' },
            price: { type: 'number' }
          }
        }
      }
    }
  },
  async (request, reply) => {
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
    return newMedicine
  }
)

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
