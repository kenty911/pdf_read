'use client'

import type { JobJSON } from '../types'

function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return ''
  const date = new Date(isoString.endsWith('Z') ? isoString : `${isoString}Z`)
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diffSec < 60) return `${diffSec}秒前`
  return `${Math.floor(diffSec / 60)}分前`
}

interface Props {
  job: JobJSON | null
}

export default function ProcessingPanel({ job }: Props) {
  const total = job?.total_lines ?? 0
  const current = job?.current_line ?? 0
  const pct = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div className="text-center">
      <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
        <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24" aria-label="変換中">
          <title>変換中</title>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">変換中...</h2>
      <p className="text-gray-500 mb-6">PDFを音声に変換しています。しばらくお待ちください。</p>

      {total > 0 && (
        <div className="text-left">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>{current} / {total} 行</span>
            <span>{pct}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          {job?.updated_at && (
            <p className="text-xs text-gray-400 mt-2">最終更新: {formatRelativeTime(job.updated_at)}</p>
          )}
        </div>
      )}
    </div>
  )
}
