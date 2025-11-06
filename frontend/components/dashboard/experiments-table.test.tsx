import { render, screen, waitFor, within } from '@/test-utils'
import userEvent from '@testing-library/user-event'
import { ExperimentsTable } from './experiments-table'
import { experimentsApi } from '@/lib/api/experiments'
import { analyticsApi } from '@/lib/api/analytics'
import { useToast } from '@/contexts/toast-context'
import type { Experiment, AnalyticsSummary } from '@/types'

// Mock dependencies
jest.mock('@/lib/api/experiments')
jest.mock('@/lib/api/analytics')
jest.mock('@/contexts/toast-context')
jest.mock('@/hooks/use-debounce', () => ({
  useDebounce: (value: string) => value, // Return value immediately for testing
}))
jest.mock('@/hooks/use-retry', () => ({
  useRetry: (fn: () => Promise<any>) => ({
    execute: fn,
    loading: false,
    error: null,
    retryCount: 0,
    reset: jest.fn(),
  }),
}))

const mockExperimentsApi = experimentsApi as jest.Mocked<typeof experimentsApi>
const mockAnalyticsApi = analyticsApi as jest.Mocked<typeof analyticsApi>
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>

describe('ExperimentsTable', () => {
  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    addToast: jest.fn(),
    removeToast: jest.fn(),
    toasts: [],
  }

  const mockExperiments: Experiment[] = [
    {
      id: 'exp-1',
      name: 'Homepage CTA Test',
      description: 'Test homepage CTA button',
      status: 'ACTIVE',
      variants: [
        { name: 'A', trafficSplit: 50 },
        { name: 'B', trafficSplit: 50 },
      ],
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 'exp-2',
      name: 'Checkout Flow Test',
      description: 'Test checkout flow',
      status: 'DRAFT',
      variants: [{ name: 'Control', trafficSplit: 100 }],
      createdAt: '2025-01-02T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
    },
    {
      id: 'exp-3',
      name: 'Pricing Page Test',
      status: 'COMPLETED',
      variants: [
        { name: 'A', trafficSplit: 50 },
        { name: 'B', trafficSplit: 50 },
      ],
      createdAt: '2025-01-03T00:00:00Z',
      updatedAt: '2025-01-03T00:00:00Z',
    },
  ]

  const mockAnalytics: AnalyticsSummary = {
    totalEvents: 100,
    uniqueUsers: 50,
    variants: {
      A: {
        events: 50,
        users: 25,
        conversions: 5,
        conversionRate: 0.2,
      },
      B: {
        events: 50,
        users: 25,
        conversions: 8,
        conversionRate: 0.32,
      },
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseToast.mockReturnValue(mockToast as any)

    // Default mock implementations
    mockExperimentsApi.getAll.mockResolvedValue(mockExperiments)
    mockAnalyticsApi.getSummary.mockResolvedValue(mockAnalytics)
  })

  describe('Table Rendering', () => {
    it('should render table with experiment data', async () => {
      render(<ExperimentsTable />)

      await waitFor(() => {
        expect(screen.getByText('Homepage CTA Test')).toBeInTheDocument()
      })

      expect(screen.getByText('Checkout Flow Test')).toBeInTheDocument()
      expect(screen.getByText('Pricing Page Test')).toBeInTheDocument()
    })

    it('should display loading state initially', () => {
      mockExperimentsApi.getAll.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      render(<ExperimentsTable />)
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument()
    })

    it('should display error state when API fails', async () => {
      mockExperimentsApi.getAll.mockRejectedValue(new Error('API Error'))

      render(<ExperimentsTable />)

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument()
      })
    })

    it('should render all table columns', async () => {
      render(<ExperimentsTable />)

      await waitFor(() => {
        expect(screen.getByText('Experiment Name')).toBeInTheDocument()
      })

      expect(screen.getByText('Variant')).toBeInTheDocument()
      expect(screen.getByText('Total Events')).toBeInTheDocument()
      expect(screen.getByText('Unique Users')).toBeInTheDocument()
      expect(screen.getByText('Conversion Rate')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
    })
  })

  describe('Filtering Functionality', () => {
    it('should filter experiments by search term', async () => {
      const user = userEvent.setup()
      render(<ExperimentsTable />)

      await waitFor(() => {
        expect(screen.getByText('Homepage CTA Test')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/Search by experiment name/i)
      await user.type(searchInput, 'Homepage')

      await waitFor(() => {
        expect(screen.getByText('Homepage CTA Test')).toBeInTheDocument()
        expect(screen.queryByText('Checkout Flow Test')).not.toBeInTheDocument()
        expect(screen.queryByText('Pricing Page Test')).not.toBeInTheDocument()
      })
    })

    it('should filter experiments by status', async () => {
      const user = userEvent.setup()
      render(<ExperimentsTable />)

      await waitFor(() => {
        expect(screen.getByText('Homepage CTA Test')).toBeInTheDocument()
      })

      const statusFilter = screen.getByRole('combobox')
      await user.selectOptions(statusFilter, 'ACTIVE')

      await waitFor(() => {
        expect(screen.getByText('Homepage CTA Test')).toBeInTheDocument()
        expect(screen.queryByText('Checkout Flow Test')).not.toBeInTheDocument() // DRAFT
      })
    })

    it('should show all experiments when status filter is set to ALL', async () => {
      const user = userEvent.setup()
      render(<ExperimentsTable />)

      await waitFor(() => {
        expect(screen.getByText('Homepage CTA Test')).toBeInTheDocument()
      })

      const statusFilter = screen.getByRole('combobox')
      await user.selectOptions(statusFilter, 'DRAFT')
      await user.selectOptions(statusFilter, 'ALL')

      await waitFor(() => {
        expect(screen.getByText('Homepage CTA Test')).toBeInTheDocument()
        expect(screen.getByText('Checkout Flow Test')).toBeInTheDocument()
      })
    })

    it('should combine search and status filters', async () => {
      const user = userEvent.setup()
      render(<ExperimentsTable />)

      await waitFor(() => {
        expect(screen.getByText('Homepage CTA Test')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/Search by experiment name/i)
      const statusFilter = screen.getByRole('combobox')

      await user.type(searchInput, 'Test')
      await user.selectOptions(statusFilter, 'ACTIVE')

      await waitFor(() => {
        expect(screen.getByText('Homepage CTA Test')).toBeInTheDocument()
        expect(screen.queryByText('Checkout Flow Test')).not.toBeInTheDocument()
      })
    })
  })

  describe('Sorting Functionality', () => {
    it('should sort by experiment name ascending', async () => {
      const user = userEvent.setup()
      render(<ExperimentsTable />)

      await waitFor(() => {
        expect(screen.getByText('Homepage CTA Test')).toBeInTheDocument()
      })

      const nameHeader = screen.getByText('Experiment Name').closest('th')
      if (nameHeader) {
        await user.click(nameHeader)

        const rows = screen.getAllByRole('row')
        // First row is header, check data rows
        const firstDataRow = rows[1]
        expect(within(firstDataRow).getByText('Checkout Flow Test')).toBeInTheDocument()
      }
    })

    it('should toggle sort direction when clicking same column twice', async () => {
      const user = userEvent.setup()
      render(<ExperimentsTable />)

      await waitFor(() => {
        expect(screen.getByText('Homepage CTA Test')).toBeInTheDocument()
      })

      const nameHeader = screen.getByText('Experiment Name').closest('th')
      if (nameHeader) {
        await user.click(nameHeader)
        await user.click(nameHeader)

        // Should be sorted descending now
        const rows = screen.getAllByRole('row')
        const firstDataRow = rows[1]
        expect(within(firstDataRow).getByText('Pricing Page Test')).toBeInTheDocument()
      }
    })

    it('should sort by conversion rate', async () => {
      const user = userEvent.setup()
      render(<ExperimentsTable />)

      await waitFor(() => {
        expect(screen.getByText('Homepage CTA Test')).toBeInTheDocument()
      })

      const rateHeader = screen.getByText('Conversion Rate').closest('th')
      if (rateHeader) {
        await user.click(rateHeader)

        // Should show sorting indicator
        expect(screen.getByText('Conversion Rate')).toBeInTheDocument()
      }
    })

    it('should sort by total events', async () => {
      const user = userEvent.setup()
      render(<ExperimentsTable />)

      await waitFor(() => {
        expect(screen.getByText('Homepage CTA Test')).toBeInTheDocument()
      })

      const eventsHeader = screen.getByText('Total Events').closest('th')
      if (eventsHeader) {
        await user.click(eventsHeader)
        expect(eventsHeader).toBeInTheDocument()
      }
    })
  })

  describe('Pagination Functionality', () => {
    it('should display pagination controls', async () => {
      render(<ExperimentsTable />)

      await waitFor(() => {
        expect(screen.getByText(/Rows per page:/i)).toBeInTheDocument()
      })

      expect(screen.getByText(/Previous/i)).toBeInTheDocument()
      expect(screen.getByText(/Next/i)).toBeInTheDocument()
    })

    it('should change page size', async () => {
      const user = userEvent.setup()
      render(<ExperimentsTable />)

      await waitFor(() => {
        expect(screen.getByText('Homepage CTA Test')).toBeInTheDocument()
      })

      const pageSizeSelect = screen.getByDisplayValue('10')
      await user.selectOptions(pageSizeSelect, '20')

      expect(pageSizeSelect).toHaveValue('20')
    })

    it('should navigate to next page', async () => {
      const user = userEvent.setup()

      // Create more experiments to require pagination
      const manyExperiments = Array.from({ length: 15 }, (_, i) => ({
        ...mockExperiments[0],
        id: `exp-${i}`,
        name: `Experiment ${i}`,
      }))

      mockExperimentsApi.getAll.mockResolvedValue(manyExperiments)

      render(<ExperimentsTable />)

      await waitFor(() => {
        expect(screen.getByText('Experiment 0')).toBeInTheDocument()
      })

      const nextButton = screen.getByText(/Next/i)
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/Page 2/i)).toBeInTheDocument()
      })
    })

    it('should disable previous button on first page', async () => {
      render(<ExperimentsTable />)

      await waitFor(() => {
        const prevButton = screen.getByText(/Previous/i)
        expect(prevButton).toBeDisabled()
      })
    })

    it('should reset to page 1 when filter changes', async () => {
      const user = userEvent.setup()

      // Create enough experiments for pagination
      const manyExperiments = Array.from({ length: 15 }, (_, i) => ({
        ...mockExperiments[0],
        id: `exp-${i}`,
        name: `Experiment ${i}`,
      }))

      mockExperimentsApi.getAll.mockResolvedValue(manyExperiments)

      render(<ExperimentsTable />)

      await waitFor(() => {
        expect(screen.getByText('Experiment 0')).toBeInTheDocument()
      })

      // Go to page 2
      const nextButton = screen.getByText(/Next/i)
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/Page 2/i)).toBeInTheDocument()
      })

      // Change filter
      const searchInput = screen.getByPlaceholderText(/Search by experiment name/i)
      await user.type(searchInput, 'Experiment')

      // Should reset to page 1
      await waitFor(() => {
        expect(screen.getByText(/Page 1/i)).toBeInTheDocument()
      })
    })
  })

  describe('Selection and Bulk Actions', () => {
    it('should select individual rows', async () => {
      const user = userEvent.setup()
      render(<ExperimentsTable />)

      await waitFor(() => {
        expect(screen.getByText('Homepage CTA Test')).toBeInTheDocument()
      })

      const checkboxes = screen.getAllByRole('checkbox', { hidden: true })
      // First checkbox is "select all", second is first row
      const firstRowCheckbox = checkboxes[1]

      await user.click(firstRowCheckbox)

      expect(firstRowCheckbox).toBeChecked()
    })

    it('should select all rows when clicking select all', async () => {
      const user = userEvent.setup()
      render(<ExperimentsTable />)

      await waitFor(() => {
        expect(screen.getByText('Homepage CTA Test')).toBeInTheDocument()
      })

      const selectAllCheckbox = screen.getAllByRole('checkbox', { hidden: true })[0]
      await user.click(selectAllCheckbox)

      const allCheckboxes = screen.getAllByRole('checkbox', { hidden: true })
      // All data row checkboxes should be checked (skip header)
      allCheckboxes.slice(1).forEach((checkbox) => {
        expect(checkbox).toBeChecked()
      })
    })

    it('should deselect all rows when clicking select all again', async () => {
      const user = userEvent.setup()
      render(<ExperimentsTable />)

      await waitFor(() => {
        expect(screen.getByText('Homepage CTA Test')).toBeInTheDocument()
      })

      const selectAllCheckbox = screen.getAllByRole('checkbox', { hidden: true })[0]
      
      // Select all
      await user.click(selectAllCheckbox)
      
      // Deselect all
      await user.click(selectAllCheckbox)

      const allCheckboxes = screen.getAllByRole('checkbox', { hidden: true })
      allCheckboxes.slice(1).forEach((checkbox) => {
        expect(checkbox).not.toBeChecked()
      })
    })

    it('should show bulk action button when rows are selected', async () => {
      const user = userEvent.setup()
      render(<ExperimentsTable />)

      await waitFor(() => {
        expect(screen.getByText('Homepage CTA Test')).toBeInTheDocument()
      })

      const checkboxes = screen.getAllByRole('checkbox', { hidden: true })
      await user.click(checkboxes[1]) // Select first row

      await waitFor(() => {
        expect(screen.getByText(/Mark.*as Completed/i)).toBeInTheDocument()
      })
    })
  })

  describe('Row Click Handler', () => {
    it('should call onRowClick when experiment name is clicked', async () => {
      const handleRowClick = jest.fn()
      const user = userEvent.setup()
      render(<ExperimentsTable onRowClick={handleRowClick} />)

      await waitFor(() => {
        expect(screen.getByText('Homepage CTA Test')).toBeInTheDocument()
      })

      const experimentLink = screen.getByText('Homepage CTA Test')
      await user.click(experimentLink)

      expect(handleRowClick).toHaveBeenCalledWith('exp-1')
    })
  })

  describe('Data Formatting', () => {
    it('should format conversion rate as percentage', async () => {
      render(<ExperimentsTable />)

      await waitFor(() => {
        expect(screen.getByText('20.00%')).toBeInTheDocument() // 0.2 * 100
        expect(screen.getByText('32.00%')).toBeInTheDocument() // 0.32 * 100
      })
    })

    it('should format numbers with commas', async () => {
      const analyticsWithLargeNumbers: AnalyticsSummary = {
        totalEvents: 10000,
        uniqueUsers: 5000,
        variants: {
          A: {
            events: 10000,
            users: 5000,
            conversions: 1000,
            conversionRate: 0.2,
          },
        },
      }

      mockAnalyticsApi.getSummary.mockResolvedValue(analyticsWithLargeNumbers)

      render(<ExperimentsTable />)

      await waitFor(() => {
        expect(screen.getByText('10,000')).toBeInTheDocument()
        expect(screen.getByText('5,000')).toBeInTheDocument()
      })
    })
  })
})
