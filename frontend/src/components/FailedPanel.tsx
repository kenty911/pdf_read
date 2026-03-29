interface Props {
  error: string
  onRetry: () => void
}

export default function FailedPanel({ error, onRetry }: Props) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
        <svg
          className="w-8 h-8 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-label="エラー"
        >
          <title>エラー</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">変換に失敗しました</h2>
      <p className="text-gray-500 mb-6">{error}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-block bg-gray-600 hover:bg-gray-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
      >
        やり直す
      </button>
    </div>
  )
}
