'use client'

interface Props {
  error: string
  onRetry: () => void
  onResume?: () => void
}

export default function FailedPanel({ error, onRetry, onResume }: Props) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="失敗">
          <title>失敗</title>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">変換に失敗しました</h2>
      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">{error}</p>
      )}

      <div className="space-y-3">
        {onResume && (
          <button
            type="button"
            onClick={onResume}
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            途中から再開
          </button>
        )}
        <button
          type="button"
          onClick={onRetry}
          className="block w-full text-gray-500 hover:text-gray-700 text-sm underline"
        >
          やり直す
        </button>
      </div>
    </div>
  )
}
