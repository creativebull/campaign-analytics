import { api } from '../api'
import type { Experiment, ExperimentStatus } from '@/types'

export const experimentsApi = {
  getAll: async (): Promise<Experiment[]> => {
    const response = await api.get<Experiment[]>('/experiments')
    return response.data
  },
  getById: async (id: string): Promise<Experiment> => {
    const response = await api.get<Experiment>(`/experiments/${id}`)
    return response.data
  },
  updateStatus: async (id: string, status: ExperimentStatus): Promise<Experiment> => {
    const response = await api.patch<Experiment>(`/experiments/${id}`, { status })
    return response.data
  },
  updateStatusBulk: async (ids: string[], status: ExperimentStatus): Promise<Experiment[]> => {
    // If backend supports bulk update, use that; otherwise update one by one
    const promises = ids.map((id) => experimentsApi.updateStatus(id, status))
    return Promise.all(promises)
  },
}