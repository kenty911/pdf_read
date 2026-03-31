import { usePlayer } from '../context/PlayerContext'
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
  const { currentTrack, isPlaying, togglePlay } = usePlayer()

  return (
    <div className="mt-12 pb-20">
      <h3 className="text-lg font-semibold text-gray-700 mb-3">変換履歴</h3>
      {jobs.length === 0 ? (
        <p className="text-sm text-gray-400">変換履歴はありません</p>
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => {
            const isThisPlaying = currentTrack?.jobId === job.id && isPlaying
            return (
              <div
                key={job.id}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3"
              >
                <div className="min-w-0 mr-3">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {job.original_filename ?? '不明'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {job.created_at ? new Date(`${job.created_at}Z`).toLocaleString('ja-JP') : ''}
                  </p>
                  {job.status === 'processing' &&
                    job.total_lines != null &&
                    job.total_lines > 0 && (
                      <div className="mt-1">
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-0.5">
                          <span>{job.current_line ?? 0}</span>
                          <span>/</span>
                          <span>{job.total_lines}行</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, Math.round(((job.current_line ?? 0) / job.total_lines) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
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
                        onClick={() =>
                          togglePlay({
                            jobId: job.id,
                            filename: job.original_filename ?? '不明',
                          })
                        }
                        className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors"
                        aria-label={isThisPlaying ? '一時停止' : '再生'}
                      >
                        {isThisPlaying ? (
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <title>一時停止</title>
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
            )
          })}
        </div>
      )}
    </div>
  )
}
