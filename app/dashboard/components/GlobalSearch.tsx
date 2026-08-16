'use client'

export type GlobalSearchResult = {
  id: string
  type: 'note' | 'flashcard' | 'subject' | 'exam'
  title: string
  description: string
  subject?: string
}

type GlobalSearchProps = {
  query: string
  results: GlobalSearchResult[]
  onQueryChange: (value: string) => void
  onOpenResult: (result: GlobalSearchResult) => void
}

function getTypeLabel(type: GlobalSearchResult['type']) {
  if (type === 'note') return 'Note'
  if (type === 'flashcard') return 'Flashcard'
  if (type === 'subject') return 'Subject'
  return 'Exam'
}

export default function GlobalSearch({
  query,
  results,
  onQueryChange,
  onOpenResult,
}: GlobalSearchProps) {
  const hasQuery = query.trim().length > 0

  return (
    <section className="surface-panel rounded-3xl border border-stone-200/80 bg-white/96 p-5 sm:p-6">
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-stone-700">Search workspace</span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search biology notes, flashcards, subjects, exams..."
          className="h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-slate-900 outline-none transition placeholder:text-stone-400 focus:border-teal-700"
        />
      </label>

      {hasQuery && (
        <div className="mt-4 rounded-3xl border border-stone-200 bg-stone-50 p-3">
          {results.length === 0 ? (
            <p className="p-3 text-sm leading-6 text-stone-600">No matching workspace items found.</p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {results.map((result) => (
                <button
                  type="button"
                  key={`${result.type}-${result.id}`}
                  onClick={() => onOpenResult(result)}
                  className="rounded-2xl border border-stone-200 bg-white p-4 text-left transition hover:border-teal-300 hover:bg-teal-50"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-800">
                      {getTypeLabel(result.type)}
                    </span>
                    {result.subject && (
                      <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-600">
                        {result.subject}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 line-clamp-1 text-sm font-semibold text-slate-900">{result.title}</p>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">{result.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
