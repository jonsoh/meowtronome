import { useEffect, useRef } from 'react'

const SWING_X = 96
const SWING_DEG = 12

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

export default function PulseIndicator({
  beat,
  isPlaying,
  bounce,
  beatsPerMeasure,
  clockRef,
  getAudioTime
}) {
  const catRef = useRef(null)

  // `beat` is the running beat index, so accents and the cat's resting side
  // derive from props (no ref reads during render).
  const accent =
    isPlaying &&
    beatsPerMeasure > 0 &&
    beat >= 0 &&
    beat % beatsPerMeasure === 0

  // Cat rests at the left extreme on even beats, the right on odd ones, so an
  // accent flashes whichever guide line it lands on.
  const accentOnRight = beat % 2 === 1

  // Phase-locked pendulum: each frame the cat's position is computed from the
  // audio clock, so it sits at an extreme exactly on every beat's onset.
  useEffect(() => {
    if (!bounce) return

    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    let raf
    const tick = () => {
      const el = catRef.current
      if (el) {
        if (!isPlaying || reduced) {
          el.style.transform = 'translateX(0px) rotate(0deg)'
        } else {
          const { time, interval, index } = clockRef.current
          const elapsed = getAudioTime() - time
          const phase = Math.min(
            1,
            Math.max(0, interval > 0 ? elapsed / interval : 0)
          )
          // `from` is the extreme this beat starts at (alternating); `factor`
          // sweeps from `from` to `-from`, keeping motion continuous.
          const from = index % 2 === 0 ? -1 : 1
          const factor = from * (1 - 2 * easeInOut(phase))
          el.style.transform = `translateX(${factor * SWING_X}px) rotate(${factor * SWING_DEG}deg)`
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [bounce, isPlaying, clockRef, getAudioTime])

  if (bounce) {
    return (
      <div className="relative flex items-center justify-center h-24 overflow-hidden">
        <div
          key={`l-${beat}`}
          aria-hidden="true"
          className={`absolute top-3 bottom-3 w-px bg-slate-500/70 dark:bg-slate-400/60 ${
            accent && !accentOnRight
              ? 'animate-guide-flash motion-reduce:animate-none'
              : ''
          }`}
          style={{ left: `calc(50% - ${SWING_X}px)` }}
        />
        <div
          key={`r-${beat}`}
          aria-hidden="true"
          className={`absolute top-3 bottom-3 w-px bg-slate-500/70 dark:bg-slate-400/60 ${
            accent && accentOnRight
              ? 'animate-guide-flash motion-reduce:animate-none'
              : ''
          }`}
          style={{ left: `calc(50% + ${SWING_X}px)` }}
        />
        <div
          ref={catRef}
          aria-hidden="true"
          className="text-5xl select-none will-change-transform"
        >
          🐱
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-2">
      <div
        key={beat}
        aria-hidden="true"
        className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl select-none ring-1 ring-black/5 dark:ring-slate-700 ${
          isPlaying
            ? `bg-purple-100 dark:bg-purple-900/40 motion-reduce:animate-none ${
                accent ? 'animate-pulse-beat-accent' : 'animate-pulse-beat'
              }`
            : 'bg-slate-100 dark:bg-slate-800'
        }`}
      >
        🐱
      </div>
    </div>
  )
}
