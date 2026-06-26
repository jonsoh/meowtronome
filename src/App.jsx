import { useEffect } from 'react'
import Button from './components/Button'
import BpmControl from './components/BpmControl'
import PulseIndicator from './components/PulseIndicator'
import Toggle from './components/Toggle'
import { useMetronome } from './hooks/useMetronome'
import { usePersistentState } from './hooks/usePersistentState'

export default function App() {
  const {
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
  } = useMetronome(100)
  const [bounce, setBounce] = usePersistentState('bounce', false)

  // Spacebar toggles start/stop, except while a form control or button is
  // focused so typing and native button activation still work normally.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code !== 'Space') return
      const tag = e.target.tagName
      if (
        tag === 'INPUT' ||
        tag === 'SELECT' ||
        tag === 'TEXTAREA' ||
        tag === 'BUTTON'
      ) {
        return
      }
      e.preventDefault()
      toggle()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggle])

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-500 via-pink-500 to-red-500 dark:from-indigo-950 dark:via-purple-950 dark:to-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl bg-white/95 backdrop-blur-sm shadow-xl shadow-purple-900/10 ring-1 ring-black/5 dark:bg-slate-900 dark:shadow-purple-950/40 dark:ring-slate-800">
        <div className="p-6 space-y-6">
          <h1 className="text-2xl font-bold text-center text-slate-900 dark:text-slate-100">
            Meowtronome 🐱
          </h1>

          <PulseIndicator
            beat={beat}
            isPlaying={isPlaying}
            bounce={bounce}
            beatsPerMeasure={beatsPerMeasure}
            clockRef={clockRef}
            getAudioTime={getAudioTime}
          />

          <BpmControl bpm={bpm} onChange={setBpm} />

          <div className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-300">
            <label htmlFor="beats-per-measure">Beats per measure</label>
            <select
              id="beats-per-measure"
              value={beatsPerMeasure}
              onChange={(e) => setBeatsPerMeasure(parseInt(e.target.value, 10))}
              className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-slate-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-purple-500"
            >
              <option value="0">Off</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
            </select>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Toggle checked={meow} onChange={setMeow} label="Meow mode 🐾" />
            <Toggle
              checked={bounce}
              onChange={setBounce}
              label="Visual mode 👀"
            />
            <Toggle
              checked={drift}
              onChange={setDrift}
              label="Tempo drift 🌀"
            />
          </div>

          <Button onClick={toggle}>{isPlaying ? 'Stop 🛑' : 'Start ▶️'}</Button>

          <p className="sr-only" role="status">
            {isPlaying
              ? `Metronome playing at ${bpm} BPM`
              : 'Metronome stopped'}
          </p>
        </div>
      </div>
    </div>
  )
}
