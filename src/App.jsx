import { useState } from 'react'
import Button from './components/Button'
import BpmControl from './components/BpmControl'
import PulseIndicator from './components/PulseIndicator'
import Toggle from './components/Toggle'
import { useMetronome } from './hooks/useMetronome'

export default function App() {
  const {
    bpm,
    setBpm,
    isPlaying,
    beat,
    meow,
    setMeow,
    toggle,
    clockRef,
    getAudioTime
  } = useMetronome(100)
  const [bounce, setBounce] = useState(false)

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
            clockRef={clockRef}
            getAudioTime={getAudioTime}
          />

          <BpmControl bpm={bpm} onChange={setBpm} />

          <div className="flex flex-col items-center gap-2">
            <Toggle checked={meow} onChange={setMeow} label="Meow mode 🐾" />
            <Toggle
              checked={bounce}
              onChange={setBounce}
              label="Visual mode 👀"
            />
          </div>

          <Button variant="primary" onClick={toggle}>
            {isPlaying ? 'Stop 🛑' : 'Start ▶️'}
          </Button>

          <p className="text-xs text-center text-slate-500 dark:text-slate-400">
            More chaos coming soon~
          </p>
        </div>
      </div>
    </div>
  )
}
