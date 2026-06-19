export default function PulseIndicator({ beat, isPlaying }) {
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
