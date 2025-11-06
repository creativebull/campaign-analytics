import { api } from '../api'
import type { AnalyticsSummary } from '@/types'

export interface AnalyticsQueryParams {
  startDate?: string
  endDate?: string
  experimentId?: string
}

export const analyticsApi = {
  getSummary: async (params: AnalyticsQueryParams): Promise<AnalyticsSummary> => {
    const response = await api.get<AnalyticsSummary>('/analytics/summary', { params })
    return response.data
  },
}