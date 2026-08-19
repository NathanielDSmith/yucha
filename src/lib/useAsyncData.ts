import { useCallback, useEffect, useState } from 'react'

interface UseAsyncDataOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

interface UseAsyncDataState<T> {
  data: T | null
  loading: boolean
  error: string | null
  retry: () => Promise<void>
}

export function useAsyncData<T>(
  asyncFn: () => Promise<T>,
  options?: UseAsyncDataOptions<T>,
): UseAsyncDataState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await asyncFn()
      setData(result)
      options?.onSuccess?.(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      options?.onError?.(err instanceof Error ? err : new Error(errorMessage))
    } finally {
      setLoading(false)
    }
  }, [asyncFn, options])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    retry: fetchData,
  }
}
