'use client'

import { useState } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { ExperimentsTable } from '@/components/dashboard/experiments-table'
import { MetricCards } from '@/components/dashboard/metric-cards'
import { ExperimentModal } from '@/components/dashboard/experiment-modal'
import type { ExperimentTableRow } from '@/types'

export default function Home() {
  const [tableRows, setTableRows] = useState<ExperimentTableRow[]>([])
  const [selectedExperimentId, setSelectedExperimentId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleRowClick = (experimentId: string) => {
    setSelectedExperimentId(experimentId)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedExperimentId(null)
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Campaign Analytics Dashboard
          </h1>
          <ThemeToggle />
        </div>
        <MetricCards rows={tableRows} />
        <ExperimentsTable
          onRowClick={handleRowClick}
          onRowsChange={setTableRows}
        />
        <ExperimentModal
          experimentId={selectedExperimentId}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      </div>
    </main>
  )
}