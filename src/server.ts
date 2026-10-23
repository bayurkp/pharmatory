import Fastify, { FastifyInstance } from 'fastify'
import fastifyStatic from '@fastify/static'
import path from 'node:path'

const fastify: FastifyInstance = Fastify({
  logger: true
})

// Register static file serving from public/
await fastify.register(fastifyStatic, {
  root: path.join(process.cwd(), 'public'),
  prefix: '/',
  index: ['index.html']
})

// API Routes
fastify.get('/api/health', async () => {
  return { status: 'healthy', timestamp: new Date().toISOString() }
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
