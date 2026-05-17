'use client'

type OnboardingPanelProps = {
  hasSubject: boolean
  hasNote: boolean
  hasFlashcards: boolean
  onCreateSubject: () => void
  onCreateNote: () => void
  onCreateFlashcards: () => void
}

export default function OnboardingPanel({
  hasSubject,
  hasNote,
  hasFlashcards,
  onCreateSubject,
  onCreateNote,
  onCreateFlashcards,
}: OnboardingPanelProps) {
  const steps = [
    {
      title: 'Create first subject',
      description: 'Start with a class or topic so your study material has a home.',
      done: hasSubject,
      action: onCreateSubject,
      label: 'Add subject',
    },
    {
      title: 'Create first note',
      description: 'Ask the AI helper a question, then save the answer as a study note.',
      done: hasNote,
      action: onCreateNote,
      label: 'Create note',
    },
    {
      title: 'Generate first flashcards',
      description: 'Turn a saved note into active-recall cards you can review later.',
      done: hasFlashcards,
      action: onCreateFlashcards,
      label: 'Make cards',
    },
  ]
  const completed = steps.filter((step) => step.done).length

  if (completed === steps.length) return null

  return (
    <section className="surface-panel rounded-3xl border border-teal-200 bg-white/96 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">Getting started</p>
          <h2 className="mt-2 text-xl font-semibold">Set up your study workspace</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Complete these first steps so the dashboard starts working around your real material.
          </p>
        </div>
        <span className="rounded-full bg-teal-50 px-4 py-2 text-xs font-semibold text-teal-800">
          {completed}/{steps.length} done
        </span>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {steps.map((step) => (
          <article
            key={step.title}
            className={`rounded-2xl border p-4 ${
              step.done ? 'border-teal-200 bg-teal-50' : 'border-stone-200 bg-stone-50'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                <p className="mt-2 text-sm leading-6 text-stone-600">{step.description}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  step.done ? 'bg-teal-900 text-white' : 'bg-white text-stone-600'
                }`}
              >
                {step.done ? 'Done' : 'Next'}
              </span>
            </div>
            {!step.done && (
              <button
                type="button"
                onClick={step.action}
                className="app-button mt-4 min-h-10 bg-teal-900 px-3 text-xs text-white hover:bg-teal-800"
              >
                {step.label}
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
