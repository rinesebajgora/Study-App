import Link from 'next/link'
import { ReactNode } from 'react'

const navItems = [
  ['Features', '/features'],
  ['Pricing', '/pricing'],
  ['FAQ', '/faq'],
  ['Support', '/contact'],
]

export default function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="page-shell min-h-screen bg-stone-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="text-lg font-semibold text-teal-950">
            StudyMate AI
          </Link>
          <nav className="flex flex-wrap items-center gap-1 text-sm font-semibold text-stone-600">
            {navItems.map(([label, href]) => (
              <Link key={href} href={href} className="rounded-xl px-3 py-2 hover:bg-stone-100 hover:text-teal-900">
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="app-button min-h-10 border border-stone-200 bg-white px-4 text-sm text-stone-700 hover:bg-stone-50">
              Log in
            </Link>
            <Link href="/signup" className="app-button min-h-10 border border-stone-200 bg-white px-4 text-sm text-stone-700 hover:bg-stone-50">
              Start free
            </Link>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-stone-200 bg-white/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-stone-600 sm:px-6">
          <p>StudyMate AI. Student workspace for notes, flashcards, exams, and revision.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/pricing" className="font-semibold text-teal-800">Pricing</Link>
            <Link href="/faq" className="font-semibold text-teal-800">FAQ</Link>
            <Link href="/contact" className="font-semibold text-teal-800">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export function ProductPreview() {
  return (
    <div className="mx-auto max-w-5xl rounded-3xl border border-stone-200 bg-white/95 p-4 shadow-2xl shadow-stone-300/40">
      <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="rounded-2xl bg-teal-950 p-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-200">Workspace</p>
          {['Subjects', 'Exam planner', 'Study notes', 'Flashcards', 'Import'].map((item, index) => (
            <div key={item} className={`mt-3 rounded-2xl px-3 py-2 text-sm ${index === 0 ? 'bg-white text-teal-950' : 'bg-teal-900/70 text-teal-50'}`}>
              {item}
            </div>
          ))}
        </aside>
        <section className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ['Revision', '82%', '6 cards due'],
              ['Coverage', '4 subjects', 'ready for exams'],
              ['Deadline', '5 days', 'chemistry final'],
            ].map(([label, value, detail]) => (
              <div key={label} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{label}</p>
                <p className="mt-2 text-2xl font-semibold">{value}</p>
                <p className="mt-2 text-sm text-stone-600">{detail}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-800">Chemistry</p>
                <h3 className="mt-2 text-lg font-semibold">Atomic structure revision plan</h3>
              </div>
              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">Exam in 5 days</span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-white p-4 text-sm leading-6 text-stone-700">
                Review electron configuration, periodic trends, and bonding examples.
              </div>
              <div className="rounded-2xl bg-white p-4 text-sm leading-6 text-stone-700">
                Flashcard: What changes across a period? Answer: atomic radius decreases.
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
