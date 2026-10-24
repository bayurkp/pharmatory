import { FastifyRequest, FastifyReply } from 'fastify'
import { WarehouseService } from './warehouse.service.js'
import { byJsonSuccess } from '../../shared/utils/by-json.util.js'

interface GetWarehousesQuery {
  city?: string
  location?: string
  isColdChainCapable?: boolean | string
  is_cold_chain_capable?: boolean | string
  coldChain?: boolean | string
  cold_chain?: boolean | string
  fullColdChainCapable?: boolean | string
}

export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  getWarehouses = async (
    request: FastifyRequest<{ Querystring: GetWarehousesQuery }>,
    reply: FastifyReply
  ) => {
    const location = request.query.city ?? request.query.location
    const rawVal =
      request.query.isColdChainCapable ??
      request.query.is_cold_chain_capable ??
      request.query.coldChain ??
      request.query.cold_chain ??
      request.query.fullColdChainCapable
    const isColdFleet =
      rawVal !== undefined
        ? typeof rawVal === 'boolean'
          ? rawVal
          : rawVal === 'true' || rawVal === '1'
        : undefined

    const warehouses = this.warehouseService.getAllWarehouses({
      location,
      isColdChainCapable: isColdFleet
    })

    return reply.status(200).send(byJsonSuccess(warehouses, request.id as string))
  }
}
