import { useRef, useState } from 'react'
import type { Job } from '../types'

interface Props {
  jobs: Job[]
}

const STATUS_BADGE: Record<string, string> = {
  completed: 'text-green-700 bg-green-100',
  failed: 'text-red-700 bg-red-100',
  processing: 'text-blue-700 bg-blue-100',
}

const STATUS_LABEL: Record<string, string> = {
  completed: '完了',
  failed: '失敗',
  processing: '変換中',
}

export default function HistoryList({ jobs }: Props) {
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const togglePlay = (jobId: string) => {
    if (playingId === jobId) {
      audioRef.current?.pause()
      setPlayingId(null)
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      const audio = new Audio(`/api/jobs/${jobId}/download`)
      audio.onended = () => setPlayingId(null)
      audio.play()
      audioRef.current = audio
      setPlayingId(jobId)
    }
  }

  return (
    <div className="mt-12">
      <h3 className="text-lg font-semibold text-gray-700 mb-3">変換履歴</h3>
      {jobs.length === 0 ? (
        <p className="text-sm text-gray-400">変換履歴はありません</p>
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3"
            >
              <div className="min-w-0 mr-3">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {job.original_filename ?? '不明'}
                </p>
                <p className="text-xs text-gray-400">
                  {job.created_at ? new Date(job.created_at).toLocaleString('ja-JP') : ''}
                </p>
              </div>
              <div className="flex items-center shrink-0 gap-2">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[job.status] ?? ''}`}
                >
                  {STATUS_LABEL[job.status] ?? job.status}
                </span>
                {job.status === 'completed' && (
                  <>
                    <button
                      type="button"
                      onClick={() => togglePlay(job.id)}
                      className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors"
                      aria-label={playingId === job.id ? '停止' : '再生'}
                    >
                      {playingId === job.id ? (
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <title>停止</title>
                          <rect x="6" y="4" width="4" height="16" />
                          <rect x="14" y="4" width="4" height="16" />
                        </svg>
                      ) : (
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <title>再生</title>
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                    <a
                      href={`/api/jobs/${job.id}/download`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      DL
                    </a>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
