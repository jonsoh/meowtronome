const BUTTON_CLASS =
  'w-full px-4 py-2 rounded-xl font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-slate-900 text-white hover:bg-slate-800 dark:bg-purple-600 dark:hover:bg-purple-500'

export default function Button({ type = 'button', className = '', ...props }) {
  return (
    <button type={type} className={`${BUTTON_CLASS} ${className}`} {...props} />
  )
}
