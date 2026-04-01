'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'

interface TrackInfo {
  jobId: string
  url: string
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

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [currentTrack, setCurrentTrack] = useState<TrackInfo | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const audio = new Audio()
    audioRef.current = audio

    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime))
    audio.addEventListener('durationchange', () => setDuration(audio.duration))
    audio.addEventListener('play', () => setIsPlaying(true))
    audio.addEventListener('pause', () => setIsPlaying(false))
    audio.addEventListener('ended', () => {
      setIsPlaying(false)
      if (currentTrack) localStorage.removeItem(`audio-pos-${currentTrack.jobId}`)
    })

    const saveInterval = setInterval(() => {
      if (currentTrack && !audio.paused) {
        localStorage.setItem(`audio-pos-${currentTrack.jobId}`, String(audio.currentTime))
      }
    }, 5000)

    return () => {
      audio.pause()
      clearInterval(saveInterval)
    }
  }, [currentTrack])

  const togglePlay = (track: TrackInfo) => {
    const audio = audioRef.current
    if (!audio) return

    if (currentTrack?.jobId === track.jobId) {
      if (audio.paused) audio.play()
      else audio.pause()
      return
    }

    audio.pause()
    audio.src = track.url
    setCurrentTrack(track)
    const saved = localStorage.getItem(`audio-pos-${track.jobId}`)
    if (saved) audio.currentTime = Number(saved)
    audio.play()
  }

  const seek = (time: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = time
    if (currentTrack) localStorage.setItem(`audio-pos-${currentTrack.jobId}`, String(time))
  }

  return (
    <PlayerContext.Provider value={{ currentTrack, isPlaying, currentTime, duration, togglePlay, seek }}>
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider')
  return ctx
}
