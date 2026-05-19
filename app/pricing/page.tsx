import Link from 'next/link'
import MarketingShell from '../components/MarketingShell'

const plans = [
  ['Starter', '$0', 'For students testing the workflow.', 'AI notes, saved library, flashcards, exam planner'],
  ['Student Pro', 'Coming soon', 'For heavy revision and exam season.', 'Higher limits, advanced analytics, priority import processing'],
  ['School', 'Contact us', 'For classrooms and study groups.', 'Admin controls, shared spaces, onboarding support'],
]

export default function PricingPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-800">Pricing</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Simple pricing placeholder.</h1>
          <p className="mt-4 text-base leading-8 text-stone-600">
            Pricing is ready to present while the product is still early. Paid tiers can be activated later.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {plans.map(([name, price, description, details]) => (
            <article key={name} className="surface-panel rounded-3xl p-5">
              <p className="text-sm font-semibold text-teal-800">{name}</p>
              <h2 className="mt-3 text-3xl font-semibold">{price}</h2>
              <p className="mt-3 text-sm leading-7 text-stone-600">{description}</p>
              <p className="mt-5 rounded-2xl bg-stone-50 p-4 text-sm leading-7 text-stone-700">{details}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-teal-100 bg-teal-50 p-5">
          <h2 className="text-xl font-semibold">No billing is active yet.</h2>
          <p className="mt-2 text-sm leading-7 text-stone-600">
            Users can sign up normally. This page is a marketing-ready placeholder for future packaging.
          </p>
          <Link href="/signup" className="app-button mt-5 bg-teal-900 px-5 text-white hover:bg-teal-800">
            Start free
          </Link>
        </div>
      </section>
    </MarketingShell>
  )
}
