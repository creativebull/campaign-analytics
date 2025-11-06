'use client'

import { useMemo } from 'react'
import { TrendingUp, Users, Target, Activity } from 'lucide-react'
import type { ExperimentTableRow } from '@/types'

interface MetricCardsProps {
  rows: ExperimentTableRow[]
}

export function MetricCards({ rows }: MetricCardsProps) {
  const metrics = useMemo(() => {
    // Get unique experiments
    const uniqueExperiments = new Set(rows.map((row) => row.experimentId))
    const totalCampaigns = uniqueExperiments.size

    // Calculate total events
    const totalEvents = rows.reduce((sum, row) => sum + row.totalEvents, 0)

    // Calculate average conversion rate
    const totalConversionRate = rows.reduce((sum, row) => sum + row.conversionRate, 0)
    const avgConversionRate = rows.length > 0 ? totalConversionRate / rows.length : 0

    // Count active experiments
    const activeExperiments = new Set(
      rows.filter((row) => row.status === 'ACTIVE').map((row) => row.experimentId)
    ).size

    return {
      totalCampaigns,
      totalEvents,
      avgConversionRate,
      activeExperiments,
    }
  }, [rows])

  const cards = [
    {
      title: 'Total Campaigns',
      value: metrics.totalCampaigns.toLocaleString(),
      icon: Activity,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Total Events',
      value: metrics.totalEvents.toLocaleString(),
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Avg Conversion Rate',
      value: `${(metrics.avgConversionRate * 100).toFixed(2)}%`,
      icon: Target,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Active Experiments',
      value: metrics.activeExperiments.toLocaleString(),
      icon: Users,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.title}
            className={`${card.bgColor} rounded-lg p-6 border border-gray-200 dark:border-gray-700`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {card.value}
                </p>
              </div>
              <div className={`${card.color} ${card.bgColor} p-3 rounded-lg`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
