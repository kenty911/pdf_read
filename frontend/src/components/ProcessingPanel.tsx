export default function ProcessingPanel() {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
        <svg
          className="w-8 h-8 text-blue-600 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
          aria-label="変換中"
        >
          <title>変換中</title>
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">変換中...</h2>
      <p className="text-gray-500">PDFを音声に変換しています。しばらくお待ちください。</p>
    </div>
  )
}
