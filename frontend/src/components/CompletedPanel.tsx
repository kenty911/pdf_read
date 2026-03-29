interface Props {
  jobId: string
  onReset: () => void
}

export default function CompletedPanel({ jobId, onReset }: Props) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
        <svg
          className="w-8 h-8 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-label="完了"
        >
          <title>完了</title>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">変換完了！</h2>
      <p className="text-gray-500 mb-6">MP3ファイルの準備ができました。</p>
      <a
        href={`/api/jobs/${jobId}/download`}
        className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
      >
        MP3をダウンロード
      </a>
      <button
        type="button"
        onClick={onReset}
        className="block mx-auto mt-4 text-sm text-gray-500 hover:text-gray-700 underline"
      >
        別のPDFを変換する
      </button>
    </div>
  )
}
