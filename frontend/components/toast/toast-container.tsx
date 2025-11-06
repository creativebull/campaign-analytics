'use client'

import { X, CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react'
import { useToast } from '@/contexts/toast-context'
import { cn } from '@/lib/utils'

export function ToastContainer() {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle className="w-5 h-5" />,
          error: <XCircle className="w-5 h-5" />,
          info: <Info className="w-5 h-5" />,
          warning: <AlertTriangle className="w-5 h-5" />,
        }

        const styles = {
          success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
          error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
          info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
          warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
        }

        return (
          <div
            key={toast.id}
            className={cn(
              'flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-slide-in-right',
              styles[toast.type]
            )}
          >
            <div className="flex-shrink-0">{icons[toast.type]}</div>
            <div className="flex-1 text-sm font-medium">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
