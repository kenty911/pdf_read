import { usePlayer } from '../context/PlayerContext'

function formatTime(sec: number) {
  if (!Number.isFinite(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function PlayerBar() {
  const { currentTrack, isPlaying, currentTime, duration, togglePlay, seek } = usePlayer()

  if (!currentTrack) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-4 shadow-lg">
      <button
        type="button"
        onClick={() => togglePlay(currentTrack)}
        className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white shrink-0 transition-colors"
        aria-label={isPlaying ? '一時停止' : '再生'}
      >
        {isPlaying ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <title>一時停止</title>
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <title>再生</title>
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-700 truncate mb-1">{currentTrack.filename}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-8 shrink-0 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.5}
            value={currentTime}
            onChange={(e) => seek(Number.parseFloat(e.target.value))}
            className="flex-1 h-1 accent-blue-600"
            aria-label="再生位置"
          />
          <span className="text-xs text-gray-400 w-8 shrink-0">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  )
}
