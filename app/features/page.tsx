import Link from 'next/link'
import MarketingShell, { ProductPreview } from '../components/MarketingShell'

const features = [
  ['Global search', 'Find notes, flashcards, subjects, and exam plans by title, subject, or workspace type.'],
  ['Material import', 'Import PDF, DOCX, and text-based files without dumping raw file text into the editor.'],
  ['AI notes', 'Turn questions and class material into structured answers you can save and organize.'],
  ['Flashcards', 'Generate active-recall cards from saved notes and track review progress.'],
  ['Exam planner', 'Build study routines from subject, date, and goal.'],
  ['Analytics', 'Track study streak, cards reviewed today, weak subjects, and upcoming deadlines.'],
]

export default function FeaturesPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-800">Features</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Everything students need after class.</h1>
          <p className="mt-4 text-base leading-8 text-stone-600">
            StudyMate AI keeps study material organized, searchable, and ready for revision.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map(([title, description]) => (
            <article key={title} className="surface-panel rounded-3xl p-5">
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-stone-600">{description}</p>
            </article>
          ))}
        </div>

        <div className="mt-10">
          <ProductPreview />
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/signup" className="app-button bg-teal-900 px-5 text-white hover:bg-teal-800">
            Start free
          </Link>
          <Link href="/pricing" className="app-button border border-stone-200 bg-white px-5 text-stone-700 hover:bg-stone-50">
            View pricing
          </Link>
        </div>
      </section>
    </MarketingShell>
  )
}
