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
  clockRef,
  getAudioTime
}) {
  const catRef = useRef(null)

  // Phase-locked pendulum: every animation frame we compute the cat's position
  // from the audio clock, so at each beat's onset (phase 0) it sits exactly at
  // an extreme and the attack lands when the cat is furthest left/right.
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
          // from = the extreme this beat starts at (alternating each beat).
          // factor sweeps from `from` (phase 0) to `-from` (phase 1), so the
          // cat is at an extreme exactly on every beat onset and the motion
          // stays continuous across beats.
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
          aria-hidden="true"
          className="absolute top-3 bottom-3 w-px bg-slate-500/70 dark:bg-slate-400/60"
          style={{ left: `calc(50% - ${SWING_X}px)` }}
        />
        <div
          aria-hidden="true"
          className="absolute top-3 bottom-3 w-px bg-slate-500/70 dark:bg-slate-400/60"
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
            ? 'bg-purple-100 dark:bg-purple-900/40 animate-pulse-beat motion-reduce:animate-none'
            : 'bg-slate-100 dark:bg-slate-800'
        }`}
      >
        🐱
      </div>
    </div>
  )
}
