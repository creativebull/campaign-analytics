'use client'

import { ThemeProvider } from '@/contexts/theme-context'
import { ToastProvider } from '@/contexts/toast-context'
import { ToastContainer } from '@/components/toast/toast-container'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        {children}
        <ToastContainer />
      </ToastProvider>
    </ThemeProvider>
  )
}
