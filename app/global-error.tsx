'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#f9fafb', fontFamily: 'system-ui, sans-serif',
        }}>
          <div style={{
            background: 'white', borderRadius: 16, border: '1px solid #f3f4f6',
            maxWidth: 400, width: '100%', padding: 40, textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠</div>
            <h2 style={{ fontSize: 20, marginBottom: 8 }}>Something went wrong</h2>
            <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 24 }}>{error.message}</p>
            <button
              onClick={reset}
              style={{
                background: '#003366', color: 'white', border: 'none', cursor: 'pointer',
                padding: '10px 24px', borderRadius: 12, fontSize: 15, fontWeight: 600,
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
