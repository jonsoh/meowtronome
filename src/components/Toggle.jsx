export default function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 w-44 text-sm font-medium text-slate-700 cursor-pointer select-none dark:text-slate-300">
      <span className="relative inline-flex shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span className="w-10 h-6 rounded-full bg-slate-300 transition-colors peer-checked:bg-purple-500 peer-focus-visible:ring-2 peer-focus-visible:ring-purple-400 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-white dark:bg-slate-600 dark:peer-checked:bg-purple-500 dark:peer-focus-visible:ring-offset-slate-900" />
        <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4 motion-reduce:transition-none" />
      </span>
      <span>{label}</span>
    </label>
  )
}
