export function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-3xl) var(--space-lg)',
        textAlign: 'center',
        backgroundColor: 'var(--color-surface-1)',
        border: '1px dashed var(--color-border)',
        borderRadius: 'var(--radius-lg)',
      }}
      role="status"
      aria-live="polite"
    >
      <p
        style={{
          color: 'var(--color-text-muted)',
          fontSize: 'var(--font-size-sm)',
          margin: 0,
          lineHeight: 1.6,
        }}
      >
        {message}
      </p>
    </div>
  )
}
