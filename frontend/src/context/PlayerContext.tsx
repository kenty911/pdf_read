import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

interface TrackInfo {
  jobId: string
  filename: string
}

interface PlayerContextValue {
  currentTrack: TrackInfo | null
  isPlaying: boolean
  currentTime: number
  duration: number
  togglePlay: (track: TrackInfo) => void
  seek: (time: number) => void
}

const PlayerContext = createContext<PlayerContextValue | null>(null)

const SAVE_INTERVAL_SEC = 5

function posKey(jobId: string) {
  return `audio-pos-${jobId}`
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<TrackInfo | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastSavedRef = useRef(0)

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
    }
    return audioRef.current
  }, [])

  useEffect(() => {
    const audio = getAudio()

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      if (audio.currentTime - lastSavedRef.current >= SAVE_INTERVAL_SEC) {
        lastSavedRef.current = audio.currentTime
        const key = posKey(audio.dataset.jobId ?? '')
        if (key) localStorage.setItem(key, String(audio.currentTime))
      }
    }
    const onDurationChange = () => setDuration(audio.duration || 0)
    const onEnded = () => {
      setIsPlaying(false)
      if (audio.dataset.jobId) {
        localStorage.removeItem(posKey(audio.dataset.jobId))
      }
      setCurrentTime(0)
    }
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
    }
  }, [getAudio])

  const togglePlay = useCallback(
    (track: TrackInfo) => {
      const audio = getAudio()

      if (currentTrack?.jobId === track.jobId) {
        if (isPlaying) {
          audio.pause()
        } else {
          audio.play()
        }
        return
      }

      // Switch to new track
      audio.pause()
      audio.src = `/api/jobs/${track.jobId}/download`
      audio.dataset.jobId = track.jobId
      setCurrentTrack(track)
      setCurrentTime(0)
      setDuration(0)
      lastSavedRef.current = 0

      audio.addEventListener(
        'loadedmetadata',
        () => {
          const saved = localStorage.getItem(posKey(track.jobId))
          if (saved) {
            audio.currentTime = Number.parseFloat(saved)
          }
          audio.play()
        },
        { once: true }
      )
      audio.load()
    },
    [currentTrack, isPlaying, getAudio]
  )

  const seek = useCallback(
    (time: number) => {
      const audio = getAudio()
      audio.currentTime = time
      setCurrentTime(time)
      if (currentTrack) {
        localStorage.setItem(posKey(currentTrack.jobId), String(time))
        lastSavedRef.current = time
      }
    },
    [getAudio, currentTrack]
  )

  return (
    <PlayerContext.Provider
      value={{ currentTrack, isPlaying, currentTime, duration, togglePlay, seek }}
    >
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider')
  return ctx
}
