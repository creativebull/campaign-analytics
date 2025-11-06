'use client'

import { useState, useEffect, useMemo } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Filter, CheckSquare, Square, Loader2 } from 'lucide-react'
import { experimentsApi } from '@/lib/api/experiments'
import { analyticsApi } from '@/lib/api/analytics'
import { useDebounce } from '@/hooks/use-debounce'
import { useRetry } from '@/hooks/use-retry'
import { useToast } from '@/contexts/toast-context'
import type { ExperimentTableRow, SortColumn, SortDirection, ExperimentStatus } from '@/types'
import { cn } from '@/lib/utils'

export function ExperimentsTable() {
  const { success, error: showError } = useToast()
  const [rows, setRows] = useState<ExperimentTableRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Selected rows for bulk actions
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<ExperimentStatus | 'ALL'>('ALL')
  const debouncedSearch = useDebounce(searchTerm, 300)
  
  // Sorting
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  
  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Retry logic for fetching data
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch experiments
      const experiments = await experimentsApi.getAll()
      
      // Fetch analytics for each experiment
      const tableRows: ExperimentTableRow[] = []
      
      for (const experiment of experiments) {
        try {
          const analytics = await analyticsApi.getSummary({
            experimentId: experiment.id,
          })
          
          // If no variants in analytics, still create rows for each variant from experiment config
          const variants = experiment.variants as Array<{ name: string; trafficSplit: number }>
          
          if (variants && variants.length > 0) {
            variants.forEach((variant) => {
              const variantMetrics = analytics.variants[variant.name] || {
                events: 0,
                users: 0,
                conversions: 0,
                conversionRate: 0,
              }
              
              tableRows.push({
                experimentId: experiment.id,
                experimentName: experiment.name,
                variant: variant.name,
                totalEvents: variantMetrics.events,
                uniqueUsers: variantMetrics.users,
                conversionRate: variantMetrics.conversionRate,
                status: experiment.status,
              })
            })
          } else {
            // If no variants configured, create a single row with default data
            const variantMetrics = analytics.variants['default'] || {
              events: analytics.totalEvents,
              users: analytics.uniqueUsers,
              conversions: 0,
              conversionRate: 0,
            }
            
            tableRows.push({
              experimentId: experiment.id,
              experimentName: experiment.name,
              variant: 'N/A',
              totalEvents: variantMetrics.events,
              uniqueUsers: variantMetrics.users,
              conversionRate: variantMetrics.conversionRate,
              status: experiment.status,
            })
          }
        } catch (err) {
          // If analytics fetch fails for an experiment, still add rows with zero metrics
          const variants = experiment.variants as Array<{ name: string; trafficSplit: number }>
          if (variants && variants.length > 0) {
            variants.forEach((variant) => {
              tableRows.push({
                experimentId: experiment.id,
                experimentName: experiment.name,
                variant: variant.name,
                totalEvents: 0,
                uniqueUsers: 0,
                conversionRate: 0,
                status: experiment.status,
              })
            })
          }
        }
      }
      
      setRows(tableRows)
      success('Data loaded successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data'
      setError(errorMessage)
      showError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const retryFetch = useRetry(fetchData, {
    maxRetries: 3,
    retryDelay: 1000,
    onRetry: (attempt) => {
      console.log(`Retrying fetch (attempt ${attempt})...`)
    },
  })

  useEffect(() => {
    retryFetch.execute()
  }, [])

  // Filter and sort data
  const filteredAndSortedRows = useMemo(() => {
    let filtered = rows.filter((row) => {
      // Search filter
      const matchesSearch = debouncedSearch === '' || 
        row.experimentName.toLowerCase().includes(debouncedSearch.toLowerCase())
      
      // Status filter
      const matchesStatus = statusFilter === 'ALL' || row.status === statusFilter
      
      return matchesSearch && matchesStatus
    })

    // Sort
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortColumn]
        const bValue = b[sortColumn]
        
        if (aValue === bValue) return 0
        
        const comparison = aValue < bValue ? -1 : 1
        return sortDirection === 'asc' ? comparison : -comparison
      })
    }

    return filtered
  }, [rows, debouncedSearch, statusFilter, sortColumn, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedRows.length / pageSize)
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredAndSortedRows.slice(start, start + pageSize)
  }, [filteredAndSortedRows, page, pageSize])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter])

  // Get unique experiment IDs from paginated rows
  const paginatedExperimentIds = useMemo(() => {
    return new Set(paginatedRows.map((row) => row.experimentId))
  }, [paginatedRows])

  // Check if all visible rows are selected
  const allSelected = useMemo(() => {
    if (paginatedRows.length === 0) return false
    return paginatedRows.every((row) => selectedRows.has(row.experimentId))
  }, [paginatedRows, selectedRows])

  // Check if some rows are selected
  const someSelected = useMemo(() => {
    return paginatedRows.some((row) => selectedRows.has(row.experimentId)) && !allSelected
  }, [paginatedRows, selectedRows, allSelected])

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-4 h-4 ml-1" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1" />
    )
  }

  const handleSelectAll = () => {
    if (allSelected) {
      // Deselect all visible rows
      const newSelected = new Set(selectedRows)
      paginatedExperimentIds.forEach((id) => newSelected.delete(id))
      setSelectedRows(newSelected)
    } else {
      // Select all visible rows
      const newSelected = new Set(selectedRows)
      paginatedExperimentIds.forEach((id) => newSelected.add(id))
      setSelectedRows(newSelected)
    }
  }

  const handleSelectRow = (experimentId: string) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(experimentId)) {
      newSelected.delete(experimentId)
    } else {
      newSelected.add(experimentId)
    }
    setSelectedRows(newSelected)
  }

  const handleBulkMarkCompleted = async () => {
    if (selectedRows.size === 0) {
      showError('Please select at least one experiment')
      return
    }

    const experimentIds = Array.from(selectedRows)
    setBulkActionLoading(true)

    try {
      await experimentsApi.updateStatusBulk(experimentIds, 'COMPLETED')
      success(`Successfully marked ${experimentIds.length} experiment(s) as completed`)
      
      // Update local state
      setRows((prevRows) =>
        prevRows.map((row) =>
          selectedRows.has(row.experimentId)
            ? { ...row, status: 'COMPLETED' as ExperimentStatus }
            : row
        )
      )
      
      // Clear selection
      setSelectedRows(new Set())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update experiments'
      showError(errorMessage)
    } finally {
      setBulkActionLoading(false)
    }
  }

  const formatConversionRate = (rate: number) => {
    return `${(rate * 100).toFixed(2)}%`
  }

  const formatStatus = (status: ExperimentStatus) => {
    const styles = {
      DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      COMPLETED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    }
    return (
      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', styles[status])}>
        {status}
      </span>
    )
  }

  if (loading && rows.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error && rows.length === 0) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-800 dark:text-red-200 mb-4">Error: {error}</p>
        <button
          onClick={() => retryFetch.execute()}
          disabled={retryFetch.loading}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {retryFetch.loading ? 'Retrying...' : 'Retry'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters and Bulk Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by experiment name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ExperimentStatus | 'ALL')}
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white appearance-none"
          >
            <option value="ALL">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
        {selectedRows.size > 0 && (
          <button
            onClick={handleBulkMarkCompleted}
            disabled={bulkActionLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {bulkActionLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              `Mark ${selectedRows.size} as Completed`
            )}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center focus:outline-none"
                  aria-label="Select all"
                >
                  {allSelected ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : someSelected ? (
                    <div className="w-5 h-5 border-2 border-blue-600 bg-blue-600 rounded flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded" />
                    </div>
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('experimentName')}
              >
                <div className="flex items-center">
                  Experiment Name
                  {getSortIcon('experimentName')}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('variant')}
              >
                <div className="flex items-center">
                  Variant
                  {getSortIcon('variant')}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('totalEvents')}
              >
                <div className="flex items-center">
                  Total Events
                  {getSortIcon('totalEvents')}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('uniqueUsers')}
              >
                <div className="flex items-center">
                  Unique Users
                  {getSortIcon('uniqueUsers')}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('conversionRate')}
              >
                <div className="flex items-center">
                  Conversion Rate
                  {getSortIcon('conversionRate')}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">
                  Status
                  {getSortIcon('status')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No data found
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, index) => {
                const isSelected = selectedRows.has(row.experimentId)
                return (
                  <tr
                    key={`${row.experimentId}-${row.variant}-${index}`}
                    className={cn(
                      'hover:bg-gray-50 dark:hover:bg-gray-800',
                      isSelected && 'bg-blue-50 dark:bg-blue-900/20'
                    )}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleSelectRow(row.experimentId)}
                        className="focus:outline-none"
                        aria-label={`Select ${row.experimentName}`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {row.experimentName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {row.variant}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {row.totalEvents.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {row.uniqueUsers.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatConversionRate(row.conversionRate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatStatus(row.status)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Rows per page:
          </span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setPage(1)
            }}
            className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Showing {filteredAndSortedRows.length === 0 ? 0 : (page - 1) * pageSize + 1} to{' '}
            {Math.min(page * pageSize, filteredAndSortedRows.length)} of{' '}
            {filteredAndSortedRows.length} results
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-white"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Page {page} of {totalPages || 1}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-white"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
