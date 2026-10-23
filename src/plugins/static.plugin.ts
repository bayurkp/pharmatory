import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import fastifyStatic from '@fastify/static'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const staticPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const publicPath = path.resolve(__dirname, '../../public')

  await fastify.register(fastifyStatic, {
    root: publicPath,
    prefix: '/',
    decorateReply: false
  })
}

export default fp(staticPlugin, { name: 'static-assets' })
