import { useCallback, useEffect, useRef, useState } from 'react'

const LOOKAHEAD_MS = 25
const SCHEDULE_AHEAD_SEC = 0.1

export const MIN_BPM = 30
export const MAX_BPM = 300

function scheduleClick(audioCtx, time) {
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.type = 'square'
  osc.frequency.value = 1000

  gain.gain.setValueAtTime(0, time)
  gain.gain.linearRampToValueAtTime(0.3, time + 0.001)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05)

  osc.connect(gain).connect(audioCtx.destination)
  osc.start(time)
  osc.stop(time + 0.06)
}

export function useMetronome(initialBpm = 100) {
  const [bpm, setBpm] = useState(initialBpm)
  const [isPlaying, setIsPlaying] = useState(false)
  const [beat, setBeat] = useState(0)

  const audioCtxRef = useRef(null)
  const nextNoteTimeRef = useRef(0)
  const bpmRef = useRef(initialBpm)
  const timerRef = useRef(null)

  useEffect(() => {
    bpmRef.current = bpm
  }, [bpm])

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsPlaying(false)
  }, [])

  const start = useCallback(() => {
    if (timerRef.current !== null) return

    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext
      audioCtxRef.current = new Ctx()
    }
    const audioCtx = audioCtxRef.current

    if (audioCtx.state === 'suspended') audioCtx.resume()

    nextNoteTimeRef.current = audioCtx.currentTime + 0.05
    setIsPlaying(true)

    timerRef.current = setInterval(() => {
      const horizon = audioCtx.currentTime + SCHEDULE_AHEAD_SEC
      while (nextNoteTimeRef.current < horizon) {
        const t = nextNoteTimeRef.current
        scheduleClick(audioCtx, t)

        const delayMs = Math.max(0, (t - audioCtx.currentTime) * 1000)
        setTimeout(() => setBeat((b) => b + 1), delayMs)

        nextNoteTimeRef.current += 60 / bpmRef.current
      }
    }, LOOKAHEAD_MS)
  }, [])

  const toggle = useCallback(() => {
    if (isPlaying) stop()
    else start()
  }, [isPlaying, start, stop])

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current)
      if (audioCtxRef.current) {
        audioCtxRef.current.close()
        audioCtxRef.current = null
      }
    }
  }, [])

  return { bpm, setBpm, isPlaying, beat, start, stop, toggle }
}
