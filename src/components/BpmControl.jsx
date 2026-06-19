import { useState } from 'react'
import { MIN_BPM, MAX_BPM } from '../hooks/useMetronome'

function clamp(value) {
  if (Number.isNaN(value)) return MIN_BPM
  return Math.min(MAX_BPM, Math.max(MIN_BPM, value))
}

export default function BpmControl({ bpm, onChange }) {
  const [draft, setDraft] = useState(String(bpm))
  const [lastBpm, setLastBpm] = useState(bpm)
  if (bpm !== lastBpm) {
    setLastBpm(bpm)
    setDraft(String(bpm))
  }

  const commitDraft = () => {
    if (draft === '' || draft === '-') {
      setDraft(String(bpm))
      return
    }
    const next = clamp(parseInt(draft, 10))
    setDraft(String(next))
    if (next !== bpm) onChange(next)
  }

  const handleNumberChange = (e) => {
    const value = e.target.value
    setDraft(value)
    if (!e.nativeEvent.inputType && value !== '') {
      const next = clamp(parseInt(value, 10))
      if (next !== bpm) onChange(next)
    }
  }

  const handleNumberKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.currentTarget.blur()
    }
  }

  const handleSliderChange = (e) => {
    onChange(clamp(parseInt(e.target.value, 10)))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <label
          htmlFor="bpm-number"
          className="text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Tempo
        </label>
        <div className="flex items-baseline gap-1">
          <input
            id="bpm-number"
            type="number"
            inputMode="numeric"
            min={MIN_BPM}
            max={MAX_BPM}
            value={draft}
            onChange={handleNumberChange}
            onBlur={commitDraft}
            onKeyDown={handleNumberKeyDown}
            className="w-20 px-2 py-1 text-right tabular-nums text-lg font-semibold rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-purple-500"
          />
          <span className="text-sm text-slate-500 dark:text-slate-400">
            BPM
          </span>
        </div>
      </div>
      <input
        type="range"
        min={MIN_BPM}
        max={MAX_BPM}
        value={bpm}
        onChange={handleSliderChange}
        aria-label="Tempo slider"
        className="w-full accent-purple-500 dark:accent-purple-400"
      />
    </div>
  )
}
