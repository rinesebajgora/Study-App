'use client'

import Link from 'next/link'
import { useAuth } from './context/AuthContext'

export default function HomePage() {
  const { user } = useAuth()
  const darkMode = false

  const metrics = [
    ['AI Q&A', 'Generate study answers instantly'],
    ['Subjects', 'Organize notes by topic'],
    ['History', 'Save answers for revision'],
  ]

  return (
    <main
      className={`page-shell min-h-screen transition-colors duration-300 ${
        darkMode ? 'bg-slate-950 text-stone-100' : 'bg-stone-50 text-slate-900'
      }`}
    >
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 px-1 py-2">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-semibold ${
                darkMode ? 'bg-amber-300 text-slate-950' : 'bg-teal-900 text-teal-50'
              }`}
            >
              SA
            </div>
            <div>
              <div className="text-sm font-semibold">StudyAI</div>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-stone-500'}`}>
                AI Study Assistant
              </p>
            </div>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:py-16">
          <div className="max-w-2xl">
            <p
              className={`text-xs font-semibold uppercase tracking-[0.24em] ${
                darkMode ? 'text-amber-200' : 'text-teal-800'
              }`}
            >
              Study smarter
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-6xl">
              StudyAI turns questions into organized study notes.
            </h1>
            <p className={`mt-6 text-base leading-8 ${darkMode ? 'text-slate-300' : 'text-stone-600'}`}>
              A responsive web application where students can ask AI questions, save useful answers,
              group them by subject, and continue learning from a protected dashboard.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={user ? '/dashboard' : '/signup'}
                className={`app-button min-w-40 ${
                  darkMode
                    ? 'bg-amber-300 text-slate-950 hover:bg-amber-200'
                    : 'bg-teal-900 text-white hover:bg-teal-800'
                }`}
              >
                {user ? 'Open dashboard' : 'Create account'}
              </Link>
              <Link
                href="/login"
                className={`app-button min-w-36 border ${
                  darkMode
                    ? 'border-white/10 bg-slate-800 text-slate-100 hover:bg-slate-700'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                Log in
              </Link>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {metrics.map(([label, copy]) => (
                <div
                  key={label}
                  className={`rounded-2xl border p-4 ${
                    darkMode ? 'border-white/10 bg-slate-900/72' : 'border-stone-200 bg-white/80'
                  }`}
                >
                  <p className="text-sm font-semibold">{label}</p>
                  <p className={`mt-2 text-sm leading-6 ${darkMode ? 'text-slate-400' : 'text-stone-600'}`}>
                    {copy}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`surface-panel rounded-3xl border p-5 sm:p-6 ${
              darkMode ? 'border-white/10 bg-slate-900/92' : 'border-stone-200/80 bg-white/96'
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${darkMode ? 'text-amber-200' : 'text-teal-800'}`}>
                  Dashboard preview
                </p>
                <h2 className="mt-2 text-2xl font-semibold">Today&apos;s study session</h2>
              </div>
              <span
                className={`rounded-full px-4 py-2 text-xs font-semibold ${
                  darkMode ? 'bg-slate-800 text-slate-300' : 'bg-teal-50 text-teal-800'
                }`}
              >
                Live app
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                ['12', 'Saved answers'],
                ['4', 'Subjects'],
                ['98%', 'Responsive UI'],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className={`rounded-2xl border p-4 ${
                    darkMode ? 'border-white/10 bg-slate-800/80' : 'border-stone-200 bg-stone-50'
                  }`}
                >
                  <p className="text-2xl font-semibold">{value}</p>
                  <p className={`mt-1 text-xs uppercase tracking-[0.18em] ${darkMode ? 'text-slate-400' : 'text-stone-500'}`}>
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <div className={`mt-5 rounded-3xl border p-5 ${darkMode ? 'border-white/10 bg-slate-800/72' : 'border-stone-200 bg-stone-50/90'}`}>
              <p className="text-sm font-semibold">Explain photosynthesis like I am preparing for an exam.</p>
              <p className={`mt-3 text-sm leading-7 ${darkMode ? 'text-slate-300' : 'text-stone-600'}`}>
                Photosynthesis is the process plants use to turn light, water, and carbon dioxide into
                glucose and oxygen. The dashboard stores answers like this so students can revise them later.
              </p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {['Secure account access', 'AI-powered answers', 'Saved question library', 'Responsive study layout'].map((item) => (
                <div
                  key={item}
                  className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                    darkMode ? 'border-white/10 bg-slate-950/45' : 'border-stone-200 bg-white'
                  }`}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
