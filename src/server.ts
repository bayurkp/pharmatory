import Fastify, { FastifyInstance } from 'fastify'

const fastify: FastifyInstance = Fastify({
  logger: true
})

fastify.get('/', async (request, reply) => {
  return { status: 'ok', message: 'Pharmatory API is running with TypeScript' }
})

fastify.get('/health', async (request, reply) => {
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
