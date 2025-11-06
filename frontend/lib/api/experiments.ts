import { api } from '../api'
import type { Experiment } from '@/types'

export const experimentsApi = {
  getAll: async (): Promise<Experiment[]> => {
    const response = await api.get<Experiment[]>('/experiments')
    return response.data
  },
  getById: async (id: string): Promise<Experiment> => {
    const response = await api.get<Experiment>(`/experiments/${id}`)
    return response.data
  },
}