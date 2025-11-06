import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ThemeProvider } from '@/contexts/theme-context'
import { ToastProvider } from '@/contexts/toast-context'

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  )
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
