import { FastifyRequest, FastifyReply } from 'fastify'
import { WarehouseService } from './warehouse.service.js'
import { byJsonSuccess } from '../../shared/utils/by-json.util.js'
import { parseArrayQueryParam } from '../../shared/utils/by-json-query.util.js'

interface GetWarehousesQuery {
  sort?: string | string[]
  city?: string
  location?: string
  'city.in'?: string | string[]
  'location.in'?: string | string[]
  'distanceKm.lte'?: number | string
  'distanceKm.gte'?: number | string
  search?: string
  storageType?: string
  isColdChainCapable?: boolean | string
  coldChain?: boolean | string
  fullColdChainCapable?: boolean | string
}

export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  getWarehouses = async (
    request: FastifyRequest<{ Querystring: GetWarehousesQuery }>,
    reply: FastifyReply
  ) => {
    const location = request.query.city ?? request.query.location
    const cities = parseArrayQueryParam(request.query['city.in'] ?? request.query['location.in'])
    const minDistanceKm =
      request.query['distanceKm.gte'] !== undefined
        ? Number(request.query['distanceKm.gte'])
        : undefined
    const maxDistanceKm =
      request.query['distanceKm.lte'] !== undefined
        ? Number(request.query['distanceKm.lte'])
        : undefined

    const { search, storageType, sort } = request.query
    const rawVal =
      request.query.isColdChainCapable ??
      request.query.coldChain ??
      request.query.fullColdChainCapable
    const isColdFleet =
      rawVal !== undefined
        ? typeof rawVal === 'boolean'
          ? rawVal
          : rawVal === 'true' || rawVal === '1'
        : undefined

    const warehouses = this.warehouseService.getAllWarehouses({
      location,
      cities,
      minDistanceKm,
      maxDistanceKm,
      search,
      storageType,
      isColdChainCapable: isColdFleet,
      sort
    })

    return reply.status(200).send(byJsonSuccess(warehouses, request.id as string))
  }
}
