'use client'

import { ReactNode } from 'react'

type AuthShellProps = {
  darkMode: boolean
  eyebrow: string
  title: string
  subtitle: string
  children: ReactNode
}

export default function AuthShell({
  darkMode,
  eyebrow,
  title,
  subtitle,
  children,
}: AuthShellProps) {
  return (
    <div
      className={`page-shell min-h-screen transition-colors duration-300 ${
        darkMode ? 'bg-slate-950 text-stone-100' : 'bg-stone-50 text-slate-900'
      }`}
    >
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 px-1 py-2">
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
              Study assistant workspace
            </p>
          </div>
        </div>

        <div className="mt-6 grid flex-1 items-stretch gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section
            className={`glass-panel flex flex-col justify-between rounded-3xl border p-8 lg:p-10 ${
              darkMode
                ? 'border-white/10 bg-slate-900/80'
                : 'border-stone-200/80 bg-white/78'
            }`}
          >
            <div>
              <p
                className={`text-xs font-semibold uppercase tracking-[0.24em] ${
                  darkMode ? 'text-amber-200' : 'text-teal-800'
                }`}
              >
                {eyebrow}
              </p>
              <h1 className="mt-5 max-w-xl text-4xl font-semibold leading-tight sm:text-[3.4rem]">
                {title}
              </h1>
              <p
                className={`mt-5 max-w-xl text-base leading-7 ${
                  darkMode ? 'text-slate-300' : 'text-stone-600'
                }`}
              >
                {subtitle}
              </p>
            </div>

            <div className="mt-10 space-y-4">
              {[
                ['Focused workflow', 'Ask, review, and save answers in one calm workspace.'],
                ['Useful history', 'Keep the explanations worth revisiting and group them by subject.'],
                ['Organized study', 'Keep your questions, answers, and subjects together in one place.'],
              ].map(([label, copy]) => (
                <div
                  key={label}
                    className={`rounded-2xl border p-4 ${
                      darkMode
                        ? 'border-white/10 bg-slate-800/80'
                        : 'border-stone-200 bg-stone-50/90'
                    }`}
                >
                  <p className="text-sm font-semibold">{label}</p>
                  <p
                    className={`mt-2 text-sm leading-6 ${
                      darkMode ? 'text-slate-400' : 'text-stone-600'
                    }`}
                  >
                    {copy}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section
            className={`surface-panel flex items-center rounded-3xl border p-6 sm:p-8 ${
              darkMode
                ? 'border-white/10 bg-slate-900/92'
                : 'border-stone-200/80 bg-white/96'
            }`}
          >
            <div className="w-full">{children}</div>
          </section>
        </div>
      </div>
    </div>
  )
}
