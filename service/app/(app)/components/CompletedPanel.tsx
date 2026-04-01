'use client'

interface Props {
  jobId: string
  onReset: () => void
}

export default function CompletedPanel({ jobId, onReset }: Props) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="完了">
          <title>完了</title>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">変換完了!</h2>
      <p className="text-gray-500 mb-6">MP3ファイルの準備ができました。</p>

      <a
        href={`/app/jobs/${jobId}/download`}
        className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors mb-3"
      >
        ダウンロード
      </a>
      <button
        type="button"
        onClick={onReset}
        className="block w-full text-gray-500 hover:text-gray-700 text-sm underline"
      >
        別のPDFを変換する
      </button>
    </div>
  )
}
