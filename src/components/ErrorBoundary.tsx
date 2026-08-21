import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  private unhandledRejectionHandler: ((event: PromiseRejectionEvent) => void) | null = null
  private unhandledErrorHandler: ((event: ErrorEvent) => void) | null = null

  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    console.error('Error boundary caught:', error)
  }

  componentDidMount() {
    this.unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
      console.error('Unhandled promise rejection:', error)
      this.setState({ hasError: true, error })
      event.preventDefault()
    }

    this.unhandledErrorHandler = (event: ErrorEvent) => {
      console.error('Unhandled error:', event.error)
      this.setState({ hasError: true, error: event.error || new Error(event.message) })
      event.preventDefault()
    }

    window.addEventListener('unhandledrejection', this.unhandledRejectionHandler)
    window.addEventListener('error', this.unhandledErrorHandler)
  }

  componentWillUnmount() {
    if (this.unhandledRejectionHandler) {
      window.removeEventListener('unhandledrejection', this.unhandledRejectionHandler)
    }
    if (this.unhandledErrorHandler) {
      window.removeEventListener('error', this.unhandledErrorHandler)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: 'var(--color-critical-wash)',
            border: '1px solid var(--color-critical)',
            borderRadius: 'var(--radius-lg)',
            margin: '2rem',
          }}
        >
          <h2 style={{ color: 'var(--color-critical)', marginBottom: '1rem' }}>
            Something went wrong
          </h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-text-inverse)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              transition: 'all var(--transition-fast)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary)'
            }}
          >
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
