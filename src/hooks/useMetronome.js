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

// Synthesize a short, cute kitten "mew" entirely from oscillators + filters.
// Recipe: a sawtooth "glottal" source pitched up in kitten territory with a
// rising, inquisitive contour, shaped by two bandpass formants for the
// "ee->ew" vowel, gently low-passed to round off the buzz, plus light
// vibrato for life.
function scheduleMeow(audioCtx, time, level = 0.5) {
  // Slightly randomize length each call (~0.17-0.23s) so mews don't feel
  // mechanically identical.
  const dur = 0.2 * (0.85 + Math.random() * 0.3)
  // Higher, kitten-sized fundamental = cuter. A small random shift each call
  // (~±10%) makes consecutive mews sound like slightly different little cats
  // instead of an identical loop.
  const f0 = 780 * (0.9 + Math.random() * 0.2)

  const osc = audioCtx.createOscillator()
  osc.type = 'sawtooth'
  // Pitch contour: quick rise to a bright peak, settling slightly UP for an
  // inquisitive "mew?" lilt (cuter than a falling adult-cat "meow").
  osc.frequency.setValueAtTime(f0 * 0.85, time)
  osc.frequency.linearRampToValueAtTime(f0 * 1.3, time + dur * 0.45)
  osc.frequency.linearRampToValueAtTime(f0 * 1.05, time + dur)

  // Light, slightly faster vibrato for a delicate shimmer. Jitter the rate
  // and depth a touch so each mew wobbles a little differently.
  const vib = audioCtx.createOscillator()
  const vibGain = audioCtx.createGain()
  vib.frequency.value = 22 * (0.85 + Math.random() * 0.3)
  vibGain.gain.value = 10 * (0.7 + Math.random() * 0.6)
  vib.connect(vibGain).connect(osc.frequency)

  // Gentle low-pass to soften the sawtooth's harshness into a rounder,
  // cuter tone.
  const softener = audioCtx.createBiquadFilter()
  softener.type = 'lowpass'
  softener.frequency.value = 3200
  softener.Q.value = 0.7

  // Master amplitude envelope: quick attack, brief hold, smooth decay.
  const master = audioCtx.createGain()
  master.gain.setValueAtTime(0, time)
  master.gain.linearRampToValueAtTime(level, time + 0.02)
  master.gain.setValueAtTime(level, time + dur * 0.5)
  master.gain.exponentialRampToValueAtTime(0.0001, time + dur)
  softener.connect(master).connect(audioCtx.destination)

  // Two formants sweeping "ee" (bright, high F2) -> "ew" (rounded, mid F2).
  const addFormant = (startHz, endHz, q, gain) => {
    const bp = audioCtx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.Q.value = q
    bp.frequency.setValueAtTime(startHz, time)
    bp.frequency.linearRampToValueAtTime(endHz, time + dur)
    const fg = audioCtx.createGain()
    fg.gain.value = gain
    osc.connect(bp).connect(fg).connect(softener)
  }
  addFormant(500, 650, 9, 1.0) // F1
  addFormant(2700, 1800, 12, 0.8) // F2 (stays brighter for a sweeter vowel)

  osc.start(time)
  vib.start(time)
  osc.stop(time + dur + 0.02)
  vib.stop(time + dur + 0.02)
}

export function useMetronome(initialBpm = 100) {
  const [bpm, setBpm] = useState(initialBpm)
  const [isPlaying, setIsPlaying] = useState(false)
  const [beat, setBeat] = useState(0)
  const [meow, setMeow] = useState(false)

  const audioCtxRef = useRef(null)
  const nextNoteTimeRef = useRef(0)
  const bpmRef = useRef(initialBpm)
  const meowRef = useRef(false)
  const timerRef = useRef(null)

  // Beat-clock anchor for phase-locked visuals: the audio-clock time the most
  // recent beat sounded, its interval, and its running index. The visual can
  // read these plus `getAudioTime()` to compute exactly where it should be.
  const beatIndexRef = useRef(0)
  const clockRef = useRef({
    time: 0,
    interval: 60 / initialBpm,
    index: 0
  })

  useEffect(() => {
    bpmRef.current = bpm
  }, [bpm])

  useEffect(() => {
    meowRef.current = meow
  }, [meow])

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

    // Park the visual clock at the first upcoming beat so the indicator can
    // sit at its starting extreme until the first beat actually sounds.
    beatIndexRef.current = 0
    clockRef.current = {
      time: nextNoteTimeRef.current,
      interval: 60 / bpmRef.current,
      index: 0
    }
    setIsPlaying(true)

    timerRef.current = setInterval(() => {
      const horizon = audioCtx.currentTime + SCHEDULE_AHEAD_SEC
      while (nextNoteTimeRef.current < horizon) {
        const t = nextNoteTimeRef.current
        if (meowRef.current) scheduleMeow(audioCtx, t)
        else scheduleClick(audioCtx, t)

        const interval = 60 / bpmRef.current
        const index = beatIndexRef.current++
        const delayMs = Math.max(0, (t - audioCtx.currentTime) * 1000)
        setTimeout(() => {
          setBeat((b) => b + 1)
          // Record the precise audio-onset time of this beat so the visual
          // phase is measured against the audio clock, not the timer.
          clockRef.current = { time: t, interval, index }
        }, delayMs)

        nextNoteTimeRef.current += interval
      }
    }, LOOKAHEAD_MS)
  }, [])

  const toggle = useCallback(() => {
    if (isPlaying) stop()
    else start()
  }, [isPlaying, start, stop])

  // Current audio-clock time, used by phase-locked visuals. Falls back to 0
  // before the AudioContext exists.
  const getAudioTime = useCallback(
    () => (audioCtxRef.current ? audioCtxRef.current.currentTime : 0),
    []
  )

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current)
      if (audioCtxRef.current) {
        audioCtxRef.current.close()
        audioCtxRef.current = null
      }
    }
  }, [])

  return {
    bpm,
    setBpm,
    isPlaying,
    beat,
    meow,
    setMeow,
    start,
    stop,
    toggle,
    clockRef,
    getAudioTime
  }
}
