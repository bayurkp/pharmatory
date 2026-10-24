import fs from 'node:fs'
import { config } from '../../config/app.config.js'
import {
  HistoricalDeliveryRecord,
  WarehouseTrafficStats,
  TrafficEstimation
} from './traffic.types.js'
import { BadRequestError } from '../../shared/errors/app-error.js'
import { DEFAULT_HISTORICAL_CSV } from './traffic.benchmark.js'

export class TrafficService {
  private records: HistoricalDeliveryRecord[] = []
  private statsByWarehouse: Map<string, WarehouseTrafficStats> = new Map()
  private initialized = false

  constructor(private readonly csvPath = config.csvPath) {}

  async initialize(): Promise<void> {
    if (this.initialized) return

    if (fs.existsSync(this.csvPath)) {
      const content = fs.readFileSync(this.csvPath, 'utf-8')
      this.records = this.parseCsvString(content)
      this.computeStats()
    } else {
      this.records = this.parseCsvString(DEFAULT_HISTORICAL_CSV)
      this.computeStats()
    }

    this.initialized = true
  }

  async resetToDefault(): Promise<void> {
    this.records = []
    this.statsByWarehouse.clear()
    this.initialized = false
    await this.initialize()
  }

  loadFromBuffer(buffer: Buffer): { recordCount: number; stats: WarehouseTrafficStats[] } {
    const content = buffer.toString('utf-8')
    const parsed = this.parseCsvString(content)

    if (parsed.length === 0) {
      throw new BadRequestError('Uploaded CSV contains no valid delivery data rows.')
    }

    // Overwrite in-memory records exclusively without disk persistence
    this.records = parsed
    this.computeStats()
    this.initialized = true

    return {
      recordCount: this.records.length,
      stats: this.getAllStats()
    }
  }

  parseCsvString(csvText: string): HistoricalDeliveryRecord[] {
    const lines = csvText.split(/\r\n|\r|\n/)
    const parsedRecords: HistoricalDeliveryRecord[] = []

    let isHeader = true
    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line) continue

      if (isHeader) {
        isHeader = false
        // Skip header row if it contains column names
        if (
          line.toLowerCase().includes('delivery id') ||
          line.toLowerCase().includes('warehouse')
        ) {
          continue
        }
      }

      // Regex to handle CSV with quotes: Delivery ID,Warehouse,"Day/Time",Actual Duration,Notes
      const regex = /(?:^|,)(?:"([^"]*)"|([^,]*))/g
      const matches: string[] = []
      let match: RegExpExecArray | null

      while ((match = regex.exec(line)) !== null) {
        matches.push(match[1] !== undefined ? match[1] : match[2])
      }

      if (matches.length >= 4) {
        const deliveryId = matches[0].trim()
        const warehouseId = matches[1].trim()
        const dayTime = matches[2].trim()
        const duration = parseInt(matches[3].trim(), 10)
        const rawNotes = matches[4] ? matches[4].trim() : undefined
        const notes =
          rawNotes &&
          rawNotes !== '-' &&
          rawNotes !== '\u2013' &&
          rawNotes !== '\u2014' &&
          !rawNotes.includes('\uFFFD') &&
          rawNotes.length > 0
            ? rawNotes
            : undefined

        // Parse Day and Time: "Mon, 08:00"
        const [dayPart, timePart] = dayTime.split(',').map((s) => s.trim())
        const [hourStr, minStr] = (timePart || '12:00').split(':')
        const hour = parseInt(hourStr, 10) || 12
        const minute = parseInt(minStr, 10) || 0

        if (!isNaN(duration) && warehouseId) {
          parsedRecords.push({
            deliveryId,
            warehouseId,
            dayOfWeek: dayPart || 'Mon',
            timeString: timePart || '12:00',
            hour,
            minute,
            actualDurationMinutes: duration,
            notes: notes && notes !== '' ? notes : undefined
          })
        }
      }
    }

    return parsedRecords
  }

  private computeStats(): void {
    this.statsByWarehouse.clear()
    const grouped = new Map<string, HistoricalDeliveryRecord[]>()
    for (const rec of this.records) {
      const list = grouped.get(rec.warehouseId) || []
      list.push(rec)
      grouped.set(rec.warehouseId, list)
    }

    for (const [wId, recs] of grouped.entries()) {
      const durations = recs.map((r) => r.actualDurationMinutes)
      const count = durations.length
      const sum = durations.reduce((acc, d) => acc + d, 0)
      const avg = Math.round(sum / count)
      const min = Math.min(...durations)
      const max = Math.max(...durations)

      // Split into peak/congested vs off-peak
      const median = (min + max) / 2
      const congested = durations.filter((d) => d > median)
      const offPeak = durations.filter((d) => d <= median)

      const congestedAvg =
        congested.length > 0
          ? Math.round(congested.reduce((a, b) => a + b, 0) / congested.length)
          : avg
      const offPeakAvg =
        offPeak.length > 0 ? Math.round(offPeak.reduce((a, b) => a + b, 0) / offPeak.length) : min

      this.statsByWarehouse.set(wId, {
        warehouseId: wId,
        sampleCount: count,
        averageDurationMinutes: avg,
        minDurationMinutes: min,
        maxDurationMinutes: max,
        congestedAvgMinutes: congestedAvg,
        offPeakAvgMinutes: offPeakAvg
      })
    }
  }

  getAllRecords(): HistoricalDeliveryRecord[] {
    return this.records
  }

  getAllStats(): WarehouseTrafficStats[] {
    return Array.from(this.statsByWarehouse.values())
  }

  getStatsForWarehouse(warehouseId: string): WarehouseTrafficStats | undefined {
    return this.statsByWarehouse.get(warehouseId)
  }

  estimateDuration(warehouseId: string, orderTimeStr?: string): TrafficEstimation {
    const stats = this.statsByWarehouse.get(warehouseId)
    const baseDuration = stats ? stats.averageDurationMinutes : 45

    if (!orderTimeStr) {
      return {
        warehouseId,
        estimatedDurationMinutes: baseDuration,
        isPeakHour: false,
        isWeekendCongestion: false,
        congestionFactor: 1.0,
        appliedRationale: `Estimated using in-memory baseline average (${baseDuration} minutes) as no specific order dispatch time was supplied.`
      }
    }

    // Try parsing date or day/time format
    let day = 'Mon'
    let hour = 12

    const parsedDate = new Date(orderTimeStr)
    if (!isNaN(parsedDate.getTime())) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      day = days[parsedDate.getDay()]
      hour = parsedDate.getHours()
    } else {
      // String format like "Mon, 08:00" or "08:00"
      if (orderTimeStr.includes(',')) {
        const parts = orderTimeStr.split(',').map((s) => s.trim())
        day = parts[0]
        const timePart = parts[1] || '12:00'
        hour = parseInt(timePart.split(':')[0], 10) || 12
      } else if (orderTimeStr.includes(':')) {
        hour = parseInt(orderTimeStr.split(':')[0], 10) || 12
      }
    }

    // 1. Check exact or close match from empirical records
    const exactRecord = this.records.find(
      (r) =>
        r.warehouseId === warehouseId &&
        r.dayOfWeek.toLowerCase() === day.toLowerCase() &&
        Math.abs(r.hour - hour) <= 1
    )

    if (exactRecord) {
      const isPeak = exactRecord.actualDurationMinutes > (stats ? stats.averageDurationMinutes : 40)
      const isWeekend =
        ['Fri', 'Sat', 'Sun'].includes(day) && (warehouseId === 'W05' || warehouseId === 'W06')
      const factor =
        stats && stats.offPeakAvgMinutes > 0
          ? Number((exactRecord.actualDurationMinutes / stats.offPeakAvgMinutes).toFixed(2))
          : 1.0

      return {
        warehouseId,
        estimatedDurationMinutes: exactRecord.actualDurationMinutes,
        isPeakHour: isPeak,
        isWeekendCongestion: isWeekend,
        congestionFactor: factor,
        appliedRationale: exactRecord.notes
          ? `Empirical in-memory delivery match (${day} ~${exactRecord.timeString}): ${exactRecord.actualDurationMinutes} mins. Note: ${exactRecord.notes}.`
          : `Empirical in-memory delivery match for ${day} ~${exactRecord.timeString} observed at ${exactRecord.actualDurationMinutes} mins.`
      }
    }

    // 2. Fallback heuristic rules based on historical patterns
    const isMorningRush =
      ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(day) && hour >= 7 && hour <= 9
    const isEveningRush =
      ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(day) && hour >= 16 && hour <= 19
    const isWeekendMalang =
      (warehouseId === 'W05' || warehouseId === 'W06') &&
      ((day === 'Fri' && hour >= 13) || day === 'Sat' || (day === 'Sun' && hour >= 14))

    if (isWeekendMalang) {
      const dur = stats ? stats.maxDurationMinutes : 180
      return {
        warehouseId,
        estimatedDurationMinutes: dur,
        isPeakHour: false,
        isWeekendCongestion: true,
        congestionFactor: 1.45,
        appliedRationale: `Malang weekend tourism corridor congestion applied for ${day} ${hour}:00 (~${dur} mins).`
      }
    }

    if (isMorningRush || isEveningRush) {
      const dur = stats ? stats.congestedAvgMinutes : Math.round(baseDuration * 2.2)
      return {
        warehouseId,
        estimatedDurationMinutes: dur,
        isPeakHour: true,
        isWeekendCongestion: false,
        congestionFactor: 2.2,
        appliedRationale: `Weekday peak urban corridor congestion applied for ${day} at ${hour}:00 (~${dur} mins).`
      }
    }

    // Off-peak
    const dur = stats ? stats.offPeakAvgMinutes : baseDuration
    return {
      warehouseId,
      estimatedDurationMinutes: dur,
      isPeakHour: false,
      isWeekendCongestion: false,
      congestionFactor: 1.0,
      appliedRationale: `Standard off-peak traffic conditions estimated for ${day} at ${hour}:00 (~${dur} mins).`
    }
  }
}

let trafficServiceInstance: TrafficService | null = null

export function getTrafficService(): TrafficService {
  if (!trafficServiceInstance) {
    trafficServiceInstance = new TrafficService()
  }
  return trafficServiceInstance
}
