import MarketingShell from '../components/MarketingShell'

const faqs = [
  ['What does StudyMate AI do?', 'It helps students import material, save AI notes, create flashcards, plan exams, and track revision progress.'],
  ['Can I import files?', 'Yes. The dashboard supports PDF, DOCX, TXT, Markdown, CSV, JSON, HTML, XML, RTF, YAML, and logs.'],
  ['Does file text show in the editor?', 'No. Imported file text stays hidden and is used only to generate the preview.'],
  ['Is pricing active?', 'Not yet. The pricing page is a placeholder for marketing readiness.'],
  ['Do I need an account?', 'Yes for the workspace. Public marketing pages are available without logging in.'],
  ['How do I get support?', 'Use the support page to send feedback, report bugs, or ask for help.'],
]

export default function FaqPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-800">FAQ</p>
        <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Questions students ask first.</h1>

        <div className="mt-8 space-y-4">
          {faqs.map(([question, answer]) => (
            <article key={question} className="surface-panel rounded-3xl p-5">
              <h2 className="text-lg font-semibold">{question}</h2>
              <p className="mt-3 text-sm leading-7 text-stone-600">{answer}</p>
            </article>
          ))}
        </div>
      </section>
    </MarketingShell>
  )
}
