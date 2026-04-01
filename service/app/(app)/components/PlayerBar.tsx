'use client'

import { usePlayer } from '../context/PlayerContext'

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function PlayerBar() {
  const { currentTrack, isPlaying, currentTime, duration, togglePlay, seek } =
    usePlayer()
  if (!currentTrack) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-4">
      <button
        type="button"
        onClick={() => togglePlay(currentTrack)}
        className="shrink-0 w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white"
        aria-label={isPlaying ? '一時停止' : '再生'}
      >
        {isPlaying ? (
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <span className="text-sm text-gray-700 truncate max-w-[200px]">
        {currentTrack.filename}
      </span>
      <span className="text-sm text-gray-500 shrink-0">
        {formatTime(currentTime)}
      </span>

      <input
        type="range"
        className="flex-1"
        min={0}
        max={duration || 0}
        step={0.5}
        value={currentTime}
        onChange={(e) => seek(Number(e.target.value))}
      />

      <span className="text-sm text-gray-500 shrink-0">
        {formatTime(duration)}
      </span>
    </div>
  )
}
