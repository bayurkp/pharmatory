import { FastifyInstance, FastifyError, FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import crypto from 'node:crypto'
import { byJsonError } from '../shared/utils/by-json.util.js'
import { AppError } from '../shared/errors/app-error.js'
import { ByJsonErrorDetail } from '../shared/types/by-json.types.js'

const errorHandlerPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Global Error Handler conforming cleanly to ByJSON Specification v2.0
  fastify.setErrorHandler((error: FastifyError | AppError | Error, request, reply) => {
    const requestId = (request.id as string) || crypto.randomUUID()

    // 1. Fastify AJV Schema Validation Errors -> HTTP 422 with native AJV keywords
    if ('validation' in error && Array.isArray(error.validation)) {
      const details: ByJsonErrorDetail[] = error.validation.map((v) => {
        let field = v.instancePath
          ? v.instancePath.replace(/^\//, '').replace(/\//g, '.')
          : ((v.params as Record<string, unknown>)?.missingProperty as string) || 'body'

        if (!field) field = 'body'

        // Clean & native: directly pass validator keyword (e.g. required, minimum, minItems, type)
        const code = v.keyword || 'invalid'
        return {
          field,
          code,
          message: v.message || 'Field validation failed'
        }
      })

      reply.status(422)
      return byJsonError(
        'validation_error',
        'The request payload failed validation against the OpenAPI specification schema.',
        requestId,
        details
      )
    }

    // 2. Fastify Multipart Errors
    if ('code' in error) {
      if (error.code === 'FST_ERR_MULTIPART_FILE_TOO_LARGE') {
        reply.status(422)
        return byJsonError(
          'file_too_large',
          'File size exceeds configured limit (maximum 10MB).',
          requestId
        )
      }
      if (error.code === 'FST_ERR_CTP_INVALID_MEDIA_TYPE' || error.code === 'FST_ERR_CTP_BODY_TOO_LARGE') {
        reply.status(422)
        return byJsonError(
          'unsupported_file_type',
          error.message,
          requestId
        )
      }
      if (error.statusCode === 400) {
        reply.status(400)
        return byJsonError(
          'bad_request',
          'Request body is malformed JSON or unparseable.',
          requestId
        )
      }
    }

    // 3. Custom Domain Application Errors
    if (error instanceof AppError) {
      reply.status(error.statusCode)
      return byJsonError(
        error.code,
        error.message,
        requestId,
        error.details
      )
    }

    // 4. Generic HTTP & Internal Errors
    const statusCode = 'statusCode' in error && typeof error.statusCode === 'number' && error.statusCode >= 400
      ? error.statusCode
      : 500

    let errorCode = 'internal_error'
    if (statusCode === 400) errorCode = 'bad_request'
    else if (statusCode === 404) errorCode = 'not_found'
    else if (statusCode === 409) errorCode = 'conflict'
    else if (statusCode === 422) errorCode = 'validation_error'

    reply.status(statusCode)
    return byJsonError(
      errorCode,
      statusCode === 500 ? 'An unexpected server error occurred.' : error.message,
      requestId
    )
  })

  // Custom 404 Handler for API routes conforming to ByJSON v2.0
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
}

export default fp(errorHandlerPlugin, { name: 'error-handler' })
