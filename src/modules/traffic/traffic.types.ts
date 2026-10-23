export interface HistoricalDeliveryRecord {
  deliveryId: string
  warehouseId: string
  dayOfWeek: string
  timeString: string
  hour: number
  minute: number
  actualDurationMinutes: number
  notes?: string
}

export interface WarehouseTrafficStats {
  warehouseId: string
  sampleCount: number
  averageDurationMinutes: number
  minDurationMinutes: number
  maxDurationMinutes: number
  congestedAvgMinutes: number
  offPeakAvgMinutes: number
}

export interface TrafficEstimation {
  warehouseId: string
  estimatedDurationMinutes: number
  isPeakHour: boolean
  isWeekendCongestion: boolean
  congestionFactor: number
  appliedRationale: string
}
