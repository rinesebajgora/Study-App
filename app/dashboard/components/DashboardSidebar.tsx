'use client'

type DashboardSidebarProps = {
  email?: string
  profileLabel?: string
  stats: string[][]
  activeSection: string | null
  onSectionChange: (section: string) => void
  onLogout: () => void
}

const workspaceSections = [
  ['Subjects', 'subjects'],
  ['Exam planner', 'exam-planner'],
  ['Study notes library', 'study-notes'],
  ['Flashcards', 'flashcards'],
  ['Quiz', 'quiz'],
  ['Import', 'import-material'],
]

export default function DashboardSidebar({
  email,
  profileLabel,
  stats,
  activeSection,
  onSectionChange,
  onLogout,
}: DashboardSidebarProps) {
  const signedInLabel = profileLabel?.trim() || email || 'Signed in'

  return (
    <>
      <div className="surface-panel rounded-3xl border border-stone-200/80 bg-white/96 p-4 xl:hidden">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-800">StudyMate AI</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">Student workspace</h1>
          <button
            onClick={onLogout}
            className="app-button min-h-9 bg-teal-900 px-3 text-xs text-white hover:bg-teal-800"
          >
            Logout
          </button>
        </div>
        <button
          type="button"
          onClick={() => onSectionChange('profile')}
          className="mt-2 wrap-break-word text-left text-xs leading-5 text-stone-500 hover:text-teal-800"
        >
          {signedInLabel}
        </button>
      </div>

      <aside className="surface-panel hidden rounded-3xl border border-stone-200/80 bg-white/96 p-5 xl:fixed xl:left-8 xl:top-4 xl:block xl:h-[calc(100vh-2rem)] xl:w-[280px] xl:overflow-y-auto">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-800">
            StudyMate AI
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Student workspace</h1>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            Organize study material first, then use AI when it helps you move faster.
          </p>
        </div>

      <button
        type="button"
        onClick={() => onSectionChange('profile')}
        className="mt-6 w-full rounded-2xl bg-teal-900 p-4 text-left text-teal-50 transition hover:bg-teal-800"
      >
        <p className="text-sm font-medium">Signed in as</p>
        <p className="mt-2 wrap-break-word text-sm leading-6 opacity-80">
          {signedInLabel}
        </p>
      </button>

      <nav className="mt-6 space-y-2" aria-label="Workspace sections">
        {workspaceSections.map(([label, id]) => (
          <button
            type="button"
            key={label}
            onClick={() => onSectionChange(id)}
            className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${
              activeSection === id
                ? 'border-teal-700 bg-teal-50'
                : 'border-stone-200 bg-stone-50 hover:bg-white'
            }`}
          >
            <span className="text-sm font-semibold text-slate-800">{label}</span>
            <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
              {activeSection === id ? 'Open' : 'View'}
            </span>
          </button>
        ))}
      </nav>

      <div className="mt-6 space-y-3">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
              {label}
            </p>
            <p className="mt-3 wrap-break-word text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <button
        onClick={onLogout}
        className="app-button mt-6 w-full justify-center bg-teal-900 text-white hover:bg-teal-800"
      >
        Logout
      </button>
      </aside>

      <nav
        className="fixed bottom-3 left-3 right-3 z-40 grid grid-cols-6 gap-2 rounded-3xl border border-stone-200 bg-white/95 p-2 shadow-xl xl:hidden"
        aria-label="Mobile workspace sections"
      >
        {workspaceSections.map(([label, id]) => (
          <button
            type="button"
            key={id}
            onClick={() => onSectionChange(id)}
            className={`min-h-12 rounded-2xl px-2 text-[11px] font-semibold leading-4 transition ${
              activeSection === id
                ? 'bg-teal-900 text-white'
                : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
            }`}
          >
            {label.replace(' library', '')}
          </button>
        ))}
      </nav>
    </>
  )
}
