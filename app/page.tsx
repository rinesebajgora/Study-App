import Link from 'next/link'
import MarketingShell, { ProductPreview } from './components/MarketingShell'

const proofPoints = [
  ['Import study material', 'Drop PDFs, DOCX, and text files, then turn them into notes and flashcards.'],
  ['Plan exam weeks', 'Create routines from subjects, dates, and goals without starting from a blank page.'],
  ['Track revision', 'See streaks, cards reviewed today, weak subjects, and upcoming deadlines.'],
]

export default function HomePage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="min-h-[72vh] rounded-3xl border border-stone-200 bg-teal-950 p-5 sm:p-8">
          <div className="flex min-h-[68vh] flex-col justify-between">
            <div className="max-w-3xl pt-8 text-white drop-shadow">
              <p className="text-xs font-semibold uppercase tracking-[0.22em]">AI study workspace</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-6xl">
                StudyMate AI
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 sm:text-lg">
                A focused workspace for students to import material, save notes, build flashcards, plan exams, and track revision progress.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/features" className="app-button border border-white/50 bg-teal-950/70 px-5 text-white hover:bg-teal-900">
                  Explore features
                </Link>
              </div>
            </div>
            <div className="grid gap-3 pb-1 md:grid-cols-3">
              {proofPoints.map(([title, description]) => (
                <div key={title} className="rounded-2xl bg-white/92 p-4 text-slate-900 shadow-lg shadow-black/10">
                  <h2 className="text-sm font-semibold">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <ProductPreview />
      </section>
    </MarketingShell>
  )
}
