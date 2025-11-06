import { useState, useCallback } from 'react'

interface UseRetryOptions {
  maxRetries?: number
  retryDelay?: number
  onRetry?: (attempt: number) => void
}

export function useRetry<T>(
  asyncFn: () => Promise<T>,
  options: UseRetryOptions = {}
) {
  const { maxRetries = 3, retryDelay = 1000, onRetry } = options
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const execute = useCallback(async (): Promise<T | null> => {
    setLoading(true)
    setError(null)

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          setRetryCount(attempt)
          onRetry?.(attempt)
          await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt))
        }

        const result = await asyncFn()
        setRetryCount(0)
        setLoading(false)
        return result
      } catch (err) {
        if (attempt === maxRetries) {
          const error = err instanceof Error ? err : new Error('Unknown error')
          setError(error)
          setLoading(false)
          setRetryCount(0)
          return null
        }
      }
    }

    setLoading(false)
    return null
  }, [asyncFn, maxRetries, retryDelay, onRetry])

  const reset = useCallback(() => {
    setError(null)
    setRetryCount(0)
  }, [])

  return { execute, loading, error, retryCount, reset }
}
