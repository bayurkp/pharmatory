import { buildApp } from './app.js'
import { config } from './config/app.config.js'

async function bootstrap(): Promise<void> {
  const app = await buildApp()

  try {
    await app.listen({ port: config.port, host: config.host })
    app.log.info(`Pharmatory Fulfillment Engine listening on http://${config.host}:${config.port}`)
    app.log.info(
      `Scalar API Documentation available at http://${config.host}:${config.port}/docs/v1`
    )
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

bootstrap()
