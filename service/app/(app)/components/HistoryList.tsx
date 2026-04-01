'use client'

import { usePlayer } from '../context/PlayerContext'
import type { JobJSON } from '../types'

interface Props {
  jobs: JobJSON[]
}

const STATUS_LABEL: Record<JobJSON['status'], string> = {
  pending: '待機中',
  processing: '変換中',
  completed: '完了',
  failed: '失敗',
}

const STATUS_COLOR: Record<JobJSON['status'], string> = {
  pending: 'bg-gray-100 text-gray-600',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
}

export default function HistoryList({ jobs }: Props) {
  const { currentTrack, isPlaying, togglePlay } = usePlayer()

  if (jobs.length === 0) return null

  return (
    <div className="mt-10">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">変換履歴</h3>
      <ul className="space-y-2">
        {jobs.map((job) => {
          const total = job.total_lines ?? 0
          const current = job.current_line ?? 0
          const pct = total > 0 ? Math.round((current / total) * 100) : 0
          const isCurrentTrack = currentTrack?.jobId === job.id

          return (
            <li
              key={job.id}
              className="bg-white rounded-lg border border-gray-200 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-gray-700 truncate flex-1">
                  {job.original_filename ?? '(不明)'}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLOR[job.status]}`}
                >
                  {STATUS_LABEL[job.status]}
                </span>
              </div>

              {job.created_at && (
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(job.created_at).toLocaleString('ja-JP')}
                </p>
              )}

              {job.status === 'processing' && total > 0 && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>
                      {current} / {total} 行
                    </span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )}

              {job.status === 'completed' && (
                <div className="mt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      togglePlay({
                        jobId: job.id,
                        url: `/app/jobs/${job.id}/download`,
                        filename: job.original_filename ?? 'output.mp3',
                      })
                    }
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {isCurrentTrack && isPlaying ? '⏸ 停止' : '▶ 再生'}
                  </button>
                  <a
                    href={`/app/jobs/${job.id}/download`}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    DL
                  </a>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
