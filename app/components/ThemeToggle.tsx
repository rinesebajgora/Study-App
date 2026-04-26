'use client'

type ThemeToggleProps = {
  darkMode: boolean
  onToggle: () => void
}

export default function ThemeToggle({ darkMode, onToggle }: ThemeToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`app-button min-w-[7.75rem] border ${
        darkMode
          ? 'border-white/10 bg-slate-800 text-slate-100 hover:bg-slate-700'
          : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
      }`}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span>{darkMode ? 'Light' : 'Dark'}</span>
    </button>
  )
}
