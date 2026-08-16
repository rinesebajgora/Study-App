'use client'

type ProfileSettingsProps = {
  email?: string
  createdAt?: string
  displayName: string
  studyLevel: string
  studyPreference: string
  savingProfile: boolean
  deletingAccount: boolean
  onDisplayNameChange: (value: string) => void
  onStudyLevelChange: (value: string) => void
  onStudyPreferenceChange: (value: string) => void
  onSaveProfile: () => void
  onLogout: () => void
  onDeleteAccount: () => void
}

export default function ProfileSettings({
  email,
  createdAt,
  displayName,
  studyLevel,
  studyPreference,
  savingProfile,
  deletingAccount,
  onDisplayNameChange,
  onStudyLevelChange,
  onStudyPreferenceChange,
  onSaveProfile,
  onLogout,
  onDeleteAccount,
}: ProfileSettingsProps) {
  const joinedLabel = createdAt ? new Date(createdAt).toLocaleDateString() : 'Recently'
  const accountName = displayName.trim() || email?.split('@')[0] || 'Student'
  const initials = accountName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'S'

  return (
    <section className="surface-panel rounded-3xl border border-stone-200/80 bg-white/96 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Profile and settings</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Manage your account, review workspace totals, and control your session.
          </p>
        </div>
        <span className="rounded-full bg-teal-50 px-4 py-2 text-xs font-semibold text-teal-800">
          Student profile
        </span>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <article className="overflow-hidden rounded-3xl border border-teal-100 bg-white">
          <div className="bg-linear-to-br from-teal-950 via-teal-900 to-teal-800 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">Account</p>
            <div className="mt-4 flex items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/10 text-lg font-semibold shadow-sm">
                {initials}
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold">{accountName}</h3>
                <p className="mt-1 truncate text-sm text-teal-100">{email ?? 'Signed in'}</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">Member since</p>
                <p className="mt-1.5 text-sm font-semibold text-slate-800">{joinedLabel}</p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">Account status</p>
                <p className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-slate-800"><span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />Active</p>
              </div>
            </div>
            <div className="mt-5 border-t border-stone-100 pt-4">
              <p className="text-xs leading-5 text-stone-500">You are currently signed in on this device.</p>
            </div>
          </div>
          <div className="border-t border-stone-100 bg-stone-50 px-5 py-4">
            <button
              type="button"
              onClick={onLogout}
              className="app-button min-h-10 border border-stone-300 bg-white px-4 text-sm text-stone-700 hover:bg-stone-100"
            >
              Logout
            </button>
          </div>
        </article>

        <article className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">Preferences</p>
          <div className="mt-4 grid gap-3">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">Display name</span>
              <input
                value={displayName ?? ''}
                onChange={(event) => onDisplayNameChange(event.target.value)}
                placeholder="Your name"
                className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-slate-900 outline-none transition focus:border-teal-700"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">Study level</span>
              <select
                value={studyLevel ?? ''}
                onChange={(event) => onStudyLevelChange(event.target.value)}
                className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-slate-900 outline-none transition focus:border-teal-700"
              >
                <option value="">Choose level</option>
                <option value="High school">High school</option>
                <option value="University">University</option>
                <option value="Self-study">Self-study</option>
                <option value="Exam prep">Exam prep</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">Study preference</span>
              <select
                value={studyPreference ?? ''}
                onChange={(event) => onStudyPreferenceChange(event.target.value)}
                className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-slate-900 outline-none transition focus:border-teal-700"
              >
                <option value="">Choose preference</option>
                <option value="Short summaries">Short summaries</option>
                <option value="Detailed explanations">Detailed explanations</option>
                <option value="Flashcards first">Flashcards first</option>
                <option value="Exam-focused plans">Exam-focused plans</option>
              </select>
            </label>
          </div>
          <button
            type="button"
            onClick={onSaveProfile}
            disabled={savingProfile}
            className="app-button mt-4 min-h-10 bg-teal-900 px-4 text-sm text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingProfile ? 'Saving...' : 'Save profile'}
          </button>
        </article>

      </div>

      <article className="mt-5 rounded-3xl border border-red-200 bg-red-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-700">Danger zone</p>
        <h3 className="mt-2 text-lg font-semibold text-slate-900">Delete account</h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-red-800">
          This permanently deletes your account and workspace data. Use this only if you are sure you no longer need your study material.
        </p>
        <button
          type="button"
          onClick={onDeleteAccount}
          disabled={deletingAccount}
          className="app-button mt-4 min-h-10 bg-red-600 px-4 text-sm text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {deletingAccount ? 'Deleting...' : 'Delete account'}
        </button>
      </article>
    </section>
  )
}
