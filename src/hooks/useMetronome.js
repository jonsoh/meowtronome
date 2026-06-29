import { useCallback, useEffect, useRef, useState } from 'react'
import {
  loadSetting,
  saveSetting,
  usePersistentState
} from './usePersistentState'

const LOOKAHEAD_MS = 25
const SCHEDULE_AHEAD_SEC = 0.1

export const MIN_BPM = 30
export const MAX_BPM = 300

function scheduleClick(audioCtx, time, accent = false) {
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.type = 'square'
  // Downbeats ring higher and louder so the start of each measure stands out.
  osc.frequency.value = accent ? 1500 : 1000
  const level = accent ? 0.42 : 0.3

  gain.gain.setValueAtTime(0, time)
  gain.gain.linearRampToValueAtTime(level, time + 0.001)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05)

  osc.connect(gain).connect(audioCtx.destination)
  osc.start(time)
  osc.stop(time + 0.06)
}

// Synthesize a short, cute kitten "mew" from oscillators + filters: a sawtooth
// "glottal" source with a rising, inquisitive contour, shaped by two bandpass
// formants for the "ee->ew" vowel, low-passed to round off the buzz.
function scheduleMeow(audioCtx, time, accent = false) {
  // Randomize length, pitch and wobble a little each call so consecutive mews
  // sound like slightly different little cats instead of an identical loop.
  const dur = 0.2 * (0.85 + Math.random() * 0.3)
  // Downbeats leap up a clear fifth and get louder (below) so the accent stays
  // unmistakable above the ±6% per-beat jitter on normal beats.
  const f0 = 780 * (0.94 + Math.random() * 0.12) * (accent ? 1.5 : 1)
  const level = accent ? 0.7 : 0.5

  const osc = audioCtx.createOscillator()
  osc.type = 'sawtooth'
  // Quick rise to a bright peak, settling slightly UP for an inquisitive
  // "mew?" lilt (cuter than a falling adult-cat "meow").
  osc.frequency.setValueAtTime(f0 * 0.85, time)
  osc.frequency.linearRampToValueAtTime(f0 * 1.3, time + dur * 0.45)
  osc.frequency.linearRampToValueAtTime(f0 * 1.05, time + dur)

  // Light vibrato for a delicate, living shimmer.
  const vib = audioCtx.createOscillator()
  const vibGain = audioCtx.createGain()
  vib.frequency.value = 22 * (0.85 + Math.random() * 0.3)
  vibGain.gain.value = 10 * (0.7 + Math.random() * 0.6)
  vib.connect(vibGain).connect(osc.frequency)

  // Soften the sawtooth's harshness into a rounder, cuter tone.
  const softener = audioCtx.createBiquadFilter()
  softener.type = 'lowpass'
  softener.frequency.value = 3200
  softener.Q.value = 0.7

  // Quick attack, brief hold, smooth decay.
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
  const [bpm, setBpmState] = useState(() => loadSetting('bpm', initialBpm))
  const [isPlaying, setIsPlaying] = useState(false)

  // `beat` is the running beat index (resets to 0 each Start); -1 means nothing
  // has played yet. It changes every tick to drive beat-synced UI.
  const [beat, setBeat] = useState(-1)
  const [meow, setMeow] = usePersistentState('meow', false)

  // Beats per measure for accents; 0 disables accents.
  const [beatsPerMeasure, setBeatsPerMeasure] = usePersistentState(
    'beatsPerMeasure',
    0
  )

  // When on, the tempo wanders via a velocity-driven random walk, roaming
  // freely (no pull to center) and only bouncing off the min/max bounds.
  const [drift, setDrift] = usePersistentState('drift', false)

  const audioCtxRef = useRef(null)
  const nextNoteTimeRef = useRef(0)
  // Precise current tempo (may be fractional); the source of truth for
  // scheduling. `bpm` state holds the rounded value for display.
  const bpmRef = useRef(bpm)
  const meowRef = useRef(false)
  const beatsPerMeasureRef = useRef(beatsPerMeasure)
  const driftRef = useRef(false)
  // Tempo "velocity" (BPM change per beat) for a smooth wandering drift.
  const driftVelocityRef = useRef(0)
  const timerRef = useRef(null)

  // Anchor for phase-locked visuals: the audio-clock time of the most recent
  // beat, its interval, and its index. With `getAudioTime()` the visual can
  // compute exactly where it should be.
  const beatIndexRef = useRef(0)
  const clockRef = useRef({
    time: 0,
    interval: 60 / bpm,
    index: 0
  })

  // Set the tempo from outside (user input), keeping the precise ref in sync
  // and persisting the user's choice. Drift mutates bpm via setBpmState
  // instead, so the wandering tempo isn't saved.
  const setBpm = useCallback((value) => {
    setBpmState(value)
    bpmRef.current = value
    saveSetting('bpm', value)
  }, [])

  useEffect(() => {
    meowRef.current = meow
  }, [meow])

  useEffect(() => {
    beatsPerMeasureRef.current = beatsPerMeasure
  }, [beatsPerMeasure])

  useEffect(() => {
    driftRef.current = drift
    // Reset momentum so toggling drift on starts from a calm, current tempo.
    if (drift) driftVelocityRef.current = 0
  }, [drift])

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsPlaying(false)
  }, [])

  // Advance the (possibly drifting) tempo by one beat and return the interval
  // in seconds. When drift is on, a damped random walk nudges a velocity that
  // the tempo integrates, bouncing off the BPM bounds.
  const advanceTempo = useCallback(() => {
    if (driftRef.current) {
      const accel = (Math.random() * 2 - 1) * 0.3
      let v = driftVelocityRef.current * 0.92 + accel
      let next = bpmRef.current + v
      if (next <= MIN_BPM) {
        next = MIN_BPM
        v = Math.abs(v) * 0.5
      } else if (next >= MAX_BPM) {
        next = MAX_BPM
        v = -Math.abs(v) * 0.5
      }
      driftVelocityRef.current = v
      bpmRef.current = next
      setBpmState(Math.round(next))
    }
    return 60 / bpmRef.current
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

    // Start each run with no drift momentum.
    driftVelocityRef.current = 0

    // Park the visual clock at the first upcoming beat so the indicator sits at
    // its starting extreme until the first beat sounds.
    beatIndexRef.current = 0
    setBeat(-1)
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
        const index = beatIndexRef.current++
        const perMeasure = beatsPerMeasureRef.current
        const accent = perMeasure > 0 && index % perMeasure === 0

        if (meowRef.current) scheduleMeow(audioCtx, t, accent)
        else scheduleClick(audioCtx, t, accent)

        const interval = advanceTempo()
        const delayMs = Math.max(0, (t - audioCtx.currentTime) * 1000)
        setTimeout(() => {
          setBeat(index)
          // Record the precise audio-onset time of this beat so the visual
          // phase is measured against the audio clock, not the timer.
          clockRef.current = { time: t, interval, index }
        }, delayMs)

        nextNoteTimeRef.current += interval
      }
    }, LOOKAHEAD_MS)
  }, [advanceTempo])

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
    beatsPerMeasure,
    setBeatsPerMeasure,
    drift,
    setDrift,
    toggle,
    clockRef,
    getAudioTime
  }
}
