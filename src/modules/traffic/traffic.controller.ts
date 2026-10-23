import { FastifyRequest, FastifyReply } from 'fastify'
import { TrafficService } from './traffic.service.js'
import { byJsonSuccess } from '../../shared/utils/by-json.util.js'
import { ValidationError, AppError } from '../../shared/errors/app-error.js'

export class TrafficController {
  constructor(private readonly trafficService: TrafficService) {}

  getTrafficPatterns = async (request: FastifyRequest, reply: FastifyReply) => {
    await this.trafficService.initialize()
    const summary = this.trafficService.getAllStats()
    const records = this.trafficService.getAllRecords()
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
    if (!filename.toLowerCase().endsWith('.csv') && fileData.mimetype !== 'text/csv' && fileData.mimetype !== 'application/vnd.ms-excel') {
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

    return reply.status(200).send(byJsonSuccess({
      filename: fileData.filename,
      processedRecords: result.recordCount,
      summary: result.stats
    }, request.id as string))
  }

  resetTraffic = async (request: FastifyRequest, reply: FastifyReply) => {
    await this.trafficService.resetToDefault()
    const summary = this.trafficService.getAllStats()
    const records = this.trafficService.getAllRecords()
    return reply.status(200).send(byJsonSuccess({
      message: 'Traffic dataset reset to default historical benchmark.',
      summary,
      recordCount: records.length
    }, request.id as string))
  }
}
