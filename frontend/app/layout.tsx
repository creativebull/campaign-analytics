import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/contexts/theme-context'
import { ToastProvider } from '@/contexts/toast-context'
import { ToastContainer } from '@/components/toast/toast-container'

export const metadata: Metadata = {
  title: 'Campaign Analytics Dashboard',
  description: 'Multi-tenant campaign analytics and A/B testing dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <ToastProvider>
            {children}
            <ToastContainer />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}