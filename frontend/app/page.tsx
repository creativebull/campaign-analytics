import { ThemeToggle } from '@/components/theme-toggle'
import { ExperimentsTable } from '@/components/dashboard/experiments-table'

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Campaign Analytics Dashboard
          </h1>
          <ThemeToggle />
        </div>
        <ExperimentsTable />
      </div>
    </main>
  )
}