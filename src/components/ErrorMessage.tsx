export function ErrorMessage({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-md)',
        padding: 'var(--space-md) var(--space-lg)',
        backgroundColor: 'var(--color-critical-wash)',
        border: '1px solid var(--color-critical)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <div style={{ flex: 1 }}>
        <p
          style={{
            color: 'var(--color-critical)',
            fontSize: 'var(--font-size-sm)',
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {message}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--color-critical)',
            color: 'var(--color-text-inverse)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-semibold)',
            transition: 'all var(--transition-fast)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-critical-dark)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-critical)'
          }}
        >
          Retry
        </button>
      )}
    </div>
  )
}
