export type ExperimentStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED'

export interface Variant {
  name: string
  trafficSplit: number
}

export interface Experiment {
  id: string
  name: string
  description?: string
  status: ExperimentStatus
  variants: Variant[]
  startDate?: string
  endDate?: string
  createdAt: string
  updatedAt: string
}

export interface VariantMetrics {
  events: number
  users: number
  conversions: number
  conversionRate: number
}

export interface AnalyticsSummary {
  totalEvents: number
  uniqueUsers: number
  variants: Record<string, VariantMetrics>
}

export interface ExperimentTableRow {
  experimentId: string
  experimentName: string
  variant: string
  totalEvents: number
  uniqueUsers: number
  conversionRate: number
  status: ExperimentStatus
}

export type SortColumn = keyof Omit<ExperimentTableRow, 'experimentId'>
export type SortDirection = 'asc' | 'desc'
