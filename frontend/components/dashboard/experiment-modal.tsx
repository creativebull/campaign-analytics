'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { experimentsApi } from '@/lib/api/experiments'
import { analyticsApi } from '@/lib/api/analytics'
import { useToast } from '@/contexts/toast-context'
import type { Experiment, VariantMetrics } from '@/types'
import { cn } from '@/lib/utils'

interface ExperimentModalProps {
  experimentId: string | null
  isOpen: boolean
  onClose: () => void
}

interface TimeSeriesDataPoint {
  date: string
  [variant: string]: string | number
}

export function ExperimentModal({ experimentId, isOpen, onClose }: ExperimentModalProps) {
  const { success, error: showError } = useToast()
  const [experiment, setExperiment] = useState<Experiment | null>(null)
  const [analytics, setAnalytics] = useState<Record<string, VariantMetrics> | null>(null)
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesDataPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && experimentId) {
      fetchExperimentData()
    } else {
      // Reset state when modal closes
      setExperiment(null)
      setAnalytics(null)
      setTimeSeriesData([])
      setError(null)
    }
  }, [isOpen, experimentId])

  const fetchExperimentData = async () => {
    if (!experimentId) return

    try {
      setLoading(true)
      setError(null)

      // Fetch experiment details
      const expData = await experimentsApi.getById(experimentId)
      setExperiment(expData)

      // Fetch analytics summary
      const analyticsData = await analyticsApi.getSummary({
        experimentId: experimentId,
      })
      setAnalytics(analyticsData.variants)

      // Generate mock time-series data (in real app, this would come from API)
      const mockTimeSeries = generateMockTimeSeriesData(analyticsData.variants)
      setTimeSeriesData(mockTimeSeries)

      success('Experiment data loaded successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load experiment data'
      setError(errorMessage)
      showError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const generateMockTimeSeriesData = (variants: Record<string, VariantMetrics>): TimeSeriesDataPoint[] => {
    // Generate last 7 days of data
    const days = 7
    const data: TimeSeriesDataPoint[] = []
    const variantNames = Object.keys(variants)

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

      const point: TimeSeriesDataPoint = { date: dateStr }

      variantNames.forEach((variantName) => {
        const variant = variants[variantName]
        // Generate realistic variation around the base conversion rate
        const baseRate = variant.conversionRate
        const variation = (Math.random() - 0.5) * 0.1 // ±5% variation
        point[variantName] = Math.max(0, Math.min(1, baseRate + variation))
      })

      data.push(point)
    }

    return data
  }

  const formatConversionRate = (rate: number) => {
    return `${(rate * 100).toFixed(2)}%`
  }

  const formatStatus = (status: string) => {
    const styles = {
      DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      COMPLETED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    }
    return (
      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', styles[status as keyof typeof styles])}>
        {status}
      </span>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <div>
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Loading...</h2>
              </div>
            ) : (
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {experiment?.name || 'Experiment Details'}
              </h2>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && !experiment ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200">Error: {error}</p>
            </div>
          ) : experiment ? (
            <div className="space-y-6">
              {/* Experiment Info */}
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {experiment.name}
                  </h3>
                  {formatStatus(experiment.status)}
                </div>
                {experiment.description && (
                  <p className="text-gray-600 dark:text-gray-400">{experiment.description}</p>
                )}
              </div>

              {/* Variant Breakdown */}
              {analytics && Object.keys(analytics).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Variant Breakdown
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Variant
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Events
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Users
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Conversions
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Conversion Rate
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(analytics).map(([variantName, metrics]) => (
                          <tr
                            key={variantName}
                            className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                              {variantName}
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-gray-600 dark:text-gray-400">
                              {metrics.events.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-gray-600 dark:text-gray-400">
                              {metrics.users.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-gray-600 dark:text-gray-400">
                              {metrics.conversions.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                              {formatConversionRate(metrics.conversionRate)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Time Series Chart */}
              {timeSeriesData.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Conversion Rate Over Time
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="date"
                          stroke="#6b7280"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis
                          stroke="#6b7280"
                          style={{ fontSize: '12px' }}
                          tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => [
                            `${(value * 100).toFixed(2)}%`,
                            'Conversion Rate',
                          ]}
                        />
                        <Legend />
                        {analytics &&
                          Object.keys(analytics).map((variantName, index) => {
                            const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
                            return (
                              <Line
                                key={variantName}
                                type="monotone"
                                dataKey={variantName}
                                stroke={colors[index % colors.length]}
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                              />
                            )
                          })}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {(!analytics || Object.keys(analytics).length === 0) && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No analytics data available for this experiment
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
