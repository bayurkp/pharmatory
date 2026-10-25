import { FastifyRequest, FastifyReply } from 'fastify'
import { TrafficService } from './traffic.service.js'
import { byJsonSuccess } from '../../shared/utils/by-json.util.js'
import { ValidationError, AppError } from '../../shared/errors/app-error.js'
import {
  parseSortQuery,
  validateSortFields,
  applyMultiFieldSort,
  parseArrayQueryParam
} from '../../shared/utils/by-json-query.util.js'

const ALLOWED_TRAFFIC_SORT_FIELDS = [
  'deliveryId',
  'warehouseId',
  'dayOfWeek',
  'timeString',
  'actualDurationMinutes',
  'notes'
]

interface GetTrafficPatternsQuery {
  sort?: string | string[]
  warehouseId?: string
  'warehouseId.in'?: string | string[]
  dayOfWeek?: string
  'dayOfWeek.in'?: string | string[]
  'actualDurationMinutes.lte'?: number | string
  'actualDurationMinutes.gte'?: number | string
  search?: string
}

export class TrafficController {
  constructor(private readonly trafficService: TrafficService) {}

  getTrafficPatterns = async (
    request: FastifyRequest<{ Querystring: GetTrafficPatternsQuery }>,
    reply: FastifyReply
  ) => {
    await this.trafficService.initialize()
    let summary = this.trafficService.getAllStats()
    let records = this.trafficService.getAllRecords()

    const { warehouseId, dayOfWeek, search, sort } = request.query || {}
    const warehouseIds = parseArrayQueryParam(request.query?.['warehouseId.in'])
    const daysOfWeek = parseArrayQueryParam(request.query?.['dayOfWeek.in'])
    const minDuration =
      request.query?.['actualDurationMinutes.gte'] !== undefined
        ? Number(request.query['actualDurationMinutes.gte'])
        : undefined
    const maxDuration =
      request.query?.['actualDurationMinutes.lte'] !== undefined
        ? Number(request.query['actualDurationMinutes.lte'])
        : undefined

    if (warehouseIds && warehouseIds.length > 0) {
      const targets = warehouseIds.map((w) => w.toUpperCase().trim())
      records = records.filter((r) => targets.includes(r.warehouseId.toUpperCase()))
      summary = summary.filter((s) => targets.includes(s.warehouseId.toUpperCase()))
    } else if (warehouseId) {
      const wid = warehouseId.toUpperCase().trim()
      records = records.filter((r) => r.warehouseId.toUpperCase() === wid)
      summary = summary.filter((s) => s.warehouseId.toUpperCase() === wid)
    }

    if (daysOfWeek && daysOfWeek.length > 0) {
      const targets = daysOfWeek.map((d) => d.toLowerCase().trim())
      records = records.filter((r) =>
        targets.some(
          (t) => r.dayOfWeek.toLowerCase() === t || r.dayOfWeek.toLowerCase().startsWith(t)
        )
      )
    } else if (dayOfWeek) {
      const dow = dayOfWeek.toLowerCase().trim()
      records = records.filter(
        (r) => r.dayOfWeek.toLowerCase() === dow || r.dayOfWeek.toLowerCase().startsWith(dow)
      )
    }

    if (minDuration !== undefined && !isNaN(minDuration)) {
      records = records.filter((r) => r.actualDurationMinutes >= minDuration)
    }

    if (maxDuration !== undefined && !isNaN(maxDuration)) {
      records = records.filter((r) => r.actualDurationMinutes <= maxDuration)
    }

    if (search) {
      const q = search.toLowerCase().trim()
      records = records.filter(
        (r) =>
          r.deliveryId.toLowerCase().includes(q) ||
          r.warehouseId.toLowerCase().includes(q) ||
          r.dayOfWeek.toLowerCase().includes(q) ||
          r.timeString.toLowerCase().includes(q) ||
          (r.notes && r.notes.toLowerCase().includes(q))
      )
    }

    if (sort) {
      const criteria = parseSortQuery(sort)
      validateSortFields(criteria, ALLOWED_TRAFFIC_SORT_FIELDS)
      records = applyMultiFieldSort(records, criteria, 'deliveryId')
    }

    return reply.status(200).send(byJsonSuccess({ summary, records }, request.id as string))
  }

  uploadTrafficCsv = async (request: FastifyRequest, reply: FastifyReply) => {
    const isMultipart = request.isMultipart()
    if (!isMultipart) {
      throw new ValidationError('Request must be multipart/form-data with a file payload.', [
        { field: 'file', code: 'missing_field', message: 'Multipart file is required.' }
      ])
    }

    const fileData = await request.file()
    if (!fileData) {
      throw new ValidationError('No file provided in multipart request payload.', [
        { field: 'file', code: 'missing_field', message: 'A CSV file must be provided.' }
      ])
    }

    // Verify CSV extension or mimetype
    const filename = fileData.filename || ''
    if (
      !filename.toLowerCase().endsWith('.csv') &&
      fileData.mimetype !== 'text/csv' &&
      fileData.mimetype !== 'application/vnd.ms-excel'
    ) {
      throw new AppError('File must be a valid CSV document.', 422, 'unsupported_file_type', [
        { field: 'file', code: 'unsupported_file_type', message: 'Only .csv files are permitted.' }
      ])
    }

    const buffer = await fileData.toBuffer()
    if (buffer.length === 0) {
      throw new ValidationError('Uploaded CSV file is empty.', [
        { field: 'file', code: 'invalid_format', message: 'File buffer cannot be empty.' }
      ])
    }

    // Process entirely in memory (zero file storage)
    const result = this.trafficService.loadFromBuffer(buffer)

    return reply.status(200).send(
      byJsonSuccess(
        {
          filename: fileData.filename,
          processedRecords: result.recordCount,
          summary: result.stats
        },
        request.id as string
      )
    )
  }

  resetTraffic = async (request: FastifyRequest, reply: FastifyReply) => {
    await this.trafficService.resetToDefault()
    const summary = this.trafficService.getAllStats()
    const records = this.trafficService.getAllRecords()
    return reply.status(200).send(
      byJsonSuccess(
        {
          message: 'Traffic dataset reset to default historical benchmark.',
          summary,
          recordCount: records.length
        },
        request.id as string
      )
    )
  }
}
