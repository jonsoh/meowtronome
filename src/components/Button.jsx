const BUTTON_BASE =
  'w-full px-4 py-2 rounded-xl font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

const BUTTON_VARIANTS = {
  primary:
    'bg-slate-900 text-white hover:bg-slate-800 dark:bg-purple-600 dark:hover:bg-purple-500',
  secondary:
    'bg-slate-200 text-slate-900 hover:bg-slate-300 disabled:hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 dark:disabled:hover:bg-slate-700',
  danger:
    'bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600'
}

export default function Button({
  variant = 'secondary',
  type = 'button',
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${className}`}
      {...props}
    />
  )
}
