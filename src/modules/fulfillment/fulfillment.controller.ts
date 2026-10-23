import { FastifyRequest, FastifyReply } from 'fastify'
import { FulfillmentService } from './fulfillment.service.js'
import { FulfillOrderRequest } from './fulfillment.types.js'
import { byJsonSuccess } from '../../shared/utils/by-json.util.js'

export class FulfillmentController {
  constructor(private readonly fulfillmentService: FulfillmentService) {}

  fulfillOrder = async (
    request: FastifyRequest<{ Body: FulfillOrderRequest }>,
    reply: FastifyReply
  ) => {
    const plan = await this.fulfillmentService.fulfillOrder(request.body)
    return reply.status(200).send(byJsonSuccess(plan, request.id as string))
  }
}
