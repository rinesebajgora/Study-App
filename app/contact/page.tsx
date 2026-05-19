import Link from 'next/link'
import MarketingShell from '../components/MarketingShell'

const supportOptions = [
  ['Product feedback', 'Share what feels useful, confusing, or missing from your study workflow.'],
  ['Bug reports', 'Report import issues, dashboard problems, or account trouble.'],
  ['School inquiries', 'Ask about classroom, tutor, or study-group usage.'],
]

export default function ContactPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-800">Contact and support</p>
            <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Get help with StudyMate AI.</h1>
            <p className="mt-4 text-base leading-8 text-stone-600">
              Use this page as the public support entry point for students, teachers, and early users.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {supportOptions.map(([title, description]) => (
                <article key={title} className="surface-panel rounded-3xl p-5">
                  <h2 className="text-base font-semibold">{title}</h2>
                  <p className="mt-3 text-sm leading-7 text-stone-600">{description}</p>
                </article>
              ))}
            </div>
          </div>

          <aside className="surface-panel rounded-3xl p-5">
            <h2 className="text-xl font-semibold">Support channel</h2>
            <p className="mt-3 text-sm leading-7 text-stone-600">
              Replace this placeholder with your real support email, chat widget, or helpdesk link when ready.
            </p>
            <Link href="/faq" className="app-button mt-5 w-full border border-stone-200 bg-white text-stone-700 hover:bg-stone-50">
              Read FAQ
            </Link>
          </aside>
        </div>
      </section>
    </MarketingShell>
  )
}
