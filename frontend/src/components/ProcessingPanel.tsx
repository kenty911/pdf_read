import type { Job } from '../types'

interface Props {
  job: Job | null
}

function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return '-'
  // MySQLのnaive datetimeはUTCとして扱う
  const date = new Date(`${isoString}Z`)
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diffSec < 60) return `${diffSec}秒前`
  const diffMin = Math.floor(diffSec / 60)
  return `${diffMin}分前`
}

export default function ProcessingPanel({ job }: Props) {
  const total = job?.total_lines ?? 0
  const current = job?.current_line ?? 0
  const percent = total > 0 ? Math.min(Math.round((current / total) * 100), 100) : 0
  const hasProgress = total > 0

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
      <p className="text-gray-500 mb-4">PDFを音声に変換しています。しばらくお待ちください。</p>

      {hasProgress && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>
              {current} / {total} 行
            </span>
            <span>{percent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            最終更新: {formatRelativeTime(job?.updated_at ?? null)}
          </p>
        </div>
      )}
    </div>
  )
}
