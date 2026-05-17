'use client'

import { QA, FilterMode, PromptSuggestion } from '../types'
import EmptyState from './EmptyState'

type SavedLibraryProps = {
  savedQA: QA[]
  filteredQA: QA[]
  sidebarSubjects: string[]
  allSubjects: string[]
  fetchingSaved: boolean
  searchTerm: string
  subjectFilter: string
  filterMode: FilterMode
  pinnedIds: string[]
  selectedQA: QA | null
  summaries: Record<string, string>
  editingId: string | null
  editQuestion: string
  editSubject: string
  summarizingId: string | null
  generatingFlashcardsId: string | null
  savingFlashcardsId: string | null
  draftFlashcards: {
    questionId: string
    cards: Array<{ front: string; back: string }>
  } | null
  flashcardCounts: Record<string, number>
  promptSuggestions: PromptSuggestion[]
  subjectOptions: string[]
  onSearchChange: (value: string) => void
  onSubjectFilterChange: (value: string) => void
  onFilterModeToggle: () => void
  onExport: () => void
  onPrint: () => void
  onPromptPick: (prompt: PromptSuggestion) => void
  onClearFilters: () => void
  onSelectQuestion: (id: string) => void
  onTogglePinned: (id: string) => void
  onEditQuestionChange: (value: string) => void
  onEditSubjectChange: (value: string) => void
  onSaveEdit: (id: string) => void
  onCancelEdit: () => void
  onStartEdit: (qa: QA) => void
  onSummary: (qa: QA) => void
  onFlashcards: (qa: QA) => void
  onSaveDraftFlashcards: () => void
  onDiscardDraftFlashcards: () => void
  onDeleteRequest: (qa: QA) => void
}

export default function SavedLibrary({
  savedQA,
  filteredQA,
  sidebarSubjects,
  allSubjects,
  fetchingSaved,
  searchTerm,
  subjectFilter,
  filterMode,
  pinnedIds,
  selectedQA,
  summaries,
  editingId,
  editQuestion,
  editSubject,
  summarizingId,
  generatingFlashcardsId,
  savingFlashcardsId,
  draftFlashcards,
  flashcardCounts,
  promptSuggestions,
  subjectOptions,
  onSearchChange,
  onSubjectFilterChange,
  onFilterModeToggle,
  onExport,
  onPrint,
  onPromptPick,
  onClearFilters,
  onSelectQuestion,
  onTogglePinned,
  onEditQuestionChange,
  onEditSubjectChange,
  onSaveEdit,
  onCancelEdit,
  onStartEdit,
  onSummary,
  onFlashcards,
  onSaveDraftFlashcards,
  onDiscardDraftFlashcards,
  onDeleteRequest,
}: SavedLibraryProps) {
  const subjectCounts = allSubjects.map((sub) => ({
    name: sub,
    total: savedQA.filter((qa) => (qa.subject || 'General') === sub).length,
    pinned: savedQA.filter((qa) => (qa.subject || 'General') === sub && pinnedIds.includes(qa.id)).length,
  }))
  const activeSubjectLabel = subjectFilter === 'All' ? 'All subjects' : subjectFilter
  const activeSubjectCount =
    subjectFilter === 'All'
      ? savedQA.length
      : savedQA.filter((qa) => (qa.subject || 'General') === subjectFilter).length

  return (
    <section className="surface-panel rounded-3xl border border-stone-200/80 bg-white/96 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Study notes library</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Browse saved notes by subject, expand answers when you need detail, and create revision summaries from the material that matters.
          </p>
        </div>
        <div className="inline-flex min-h-10 items-center rounded-full bg-stone-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
          {fetchingSaved ? 'Syncing' : `${savedQA.length} items`}
        </div>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">Search notes</span>
          <input
            type="search"
            value={searchTerm ?? ''}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by question, answer, or subject..."
            className="h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-slate-900 outline-none transition placeholder:text-stone-400 focus:border-teal-700"
          />
        </label>
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={onExport}
            className="app-button min-h-12 border border-stone-200 bg-white px-4 text-stone-700 hover:bg-stone-50"
          >
            Export TXT
          </button>
          <button
            type="button"
            onClick={onPrint}
            className="app-button min-h-12 bg-teal-900 px-4 text-white hover:bg-teal-800"
          >
            Print PDF
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-stone-200 bg-stone-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">
              Active filter
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-800">
              {activeSubjectLabel} · {activeSubjectCount} notes
            </p>
          </div>
          {(subjectFilter !== 'All' || filterMode === 'pinned' || searchTerm.trim()) && (
            <button
              type="button"
              onClick={onClearFilters}
              className="app-button min-h-10 border border-stone-200 bg-white px-3 text-xs text-stone-700 hover:bg-stone-50"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => onSubjectFilterChange('All')}
            className={`app-button min-h-10 shrink-0 border px-3 text-xs ${
              subjectFilter === 'All'
                ? 'bg-teal-900 text-white'
                : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
            }`}
          >
            All · {savedQA.length}
          </button>
          {subjectCounts.map((sub) => (
            <button
              type="button"
              key={sub.name}
              onClick={() => onSubjectFilterChange(sub.name)}
              className={`app-button min-h-10 shrink-0 border px-3 text-xs ${
                subjectFilter === sub.name
                  ? 'bg-teal-900 text-white'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              {sub.name} · {sub.total}
            </button>
          ))}
          <button
            type="button"
            onClick={onFilterModeToggle}
            className={`app-button min-h-10 shrink-0 border px-3 text-xs ${
              filterMode === 'pinned'
                ? 'bg-teal-900 text-white'
                : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
            }`}
          >
            Pinned · {pinnedIds.length}
          </button>
        </div>
      </div>

      <div className="mt-6">
        {fetchingSaved ? (
          <div className="space-y-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-3xl border border-stone-200 bg-stone-100"
              />
            ))}
          </div>
        ) : savedQA.length === 0 ? (
          <EmptyState
            title="No saved notes yet."
            description="Generate an answer with the AI helper, then save the notes you want to review later."
            actions={promptSuggestions.map((prompt) => ({
              label: `Try ${prompt.subject}`,
              onClick: () => onPromptPick(prompt),
            }))}
          />
        ) : filteredQA.length === 0 ? (
          <EmptyState
            title="No matching notes found."
            description="Try a different search term or clear the selected filters."
            actions={[{ label: 'Clear filters', onClick: onClearFilters }]}
          />
        ) : (
          <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-800">
                  Notes
                </h3>
                <p className="mt-1 text-xs text-stone-500">
                  Grouped by subject
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-600">
                {filteredQA.length}
              </span>
            </div>

            <datalist id="saved-library-subjects">
              {subjectOptions.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>

            <div className="space-y-5">
              {sidebarSubjects.map((sub) => (
                <div key={sub}>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-800">
                      {sub}
                    </h4>
                    <span className="text-[11px] text-stone-500">
                      {filteredQA.filter((qa) => (qa.subject || 'General') === sub).length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {filteredQA
                      .filter((qa) => (qa.subject || 'General') === sub)
                      .map((qa) => {
                        const selected = selectedQA?.id === qa.id
                        const editing = editingId === qa.id

                        return (
                          <article
                            key={qa.id}
                            className={`rounded-2xl border bg-white p-3 transition ${
                              selected
                                ? 'border-teal-700 bg-teal-50'
                                : 'border-stone-200 hover:border-teal-200'
                            }`}
                          >
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => onSelectQuestion(qa.id)}
                                className="min-w-0 flex-1 text-left"
                              >
                                <p className="text-sm font-semibold leading-5 text-slate-900">
                                  {qa.question}
                                </p>
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                  <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-600">
                                    {qa.subject || 'General'}
                                  </span>
                                  {summaries[qa.id] && (
                                    <span className="rounded-full bg-teal-100 px-2.5 py-1 text-[11px] font-semibold text-teal-800">
                                      Summary
                                    </span>
                                  )}
                                  {flashcardCounts[qa.id] ? (
                                    <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-semibold text-orange-700">
                                      {flashcardCounts[qa.id]} cards
                                    </span>
                                  ) : null}
                                  {pinnedIds.includes(qa.id) && (
                                    <span className="rounded-full bg-teal-900 px-2.5 py-1 text-[11px] font-semibold text-white">
                                      Pinned
                                    </span>
                                  )}
                                </div>
                              </button>
                              <button
                                type="button"
                                onClick={() => onTogglePinned(qa.id)}
                                className={`app-button min-h-0 w-16 shrink-0 rounded-2xl border px-2 text-[11px] ${
                                  pinnedIds.includes(qa.id)
                                    ? 'border-teal-700 bg-teal-900 text-white hover:bg-teal-800'
                                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                                }`}
                              >
                                {pinnedIds.includes(qa.id) ? 'Unpin' : 'Pin'}
                              </button>
                            </div>

                            {selected && (
                              <div className="mt-4 border-t border-teal-200 pt-4">
                                {editing ? (
                                  <div className="space-y-3">
                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">
                                        Editing note
                                      </p>
                                      <p className="mt-2 text-sm leading-6 text-stone-600">
                                        Keep the question clear and attach it to the right subject.
                                      </p>
                                    </div>
                                    <input
                                      type="text"
                                      value={editQuestion ?? ''}
                                      onChange={(event) => onEditQuestionChange(event.target.value)}
                                      className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-3 text-slate-900 outline-none"
                                    />
                                    <input
                                      type="text"
                                      value={editSubject ?? ''}
                                      list="saved-library-subjects"
                                      onChange={(event) => onEditSubjectChange(event.target.value)}
                                      className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-3 text-slate-900 outline-none"
                                    />
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        onClick={() => onSaveEdit(qa.id)}
                                        className="app-button min-w-37 bg-teal-900 text-white hover:bg-teal-800"
                                      >
                                        Save changes
                                      </button>
                                      <button
                                        onClick={onCancelEdit}
                                        className="app-button min-w-32 bg-stone-200 text-stone-800 hover:bg-stone-300"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    <div className="rounded-2xl border border-stone-200 bg-white p-4">
                                      <p className="text-sm font-semibold text-slate-800">Answer</p>
                                      <p className="mt-3 max-h-80 overflow-y-auto whitespace-pre-wrap text-sm leading-7 text-slate-700">
                                        {qa.answer}
                                      </p>
                                    </div>

                                    {summaries[qa.id] && (
                                      <div className="rounded-2xl border border-teal-200 bg-white p-4">
                                        <p className="text-sm font-semibold text-teal-800">Revision summary</p>
                                        <p className="mt-3 max-h-72 overflow-y-auto whitespace-pre-wrap text-sm leading-7">
                                          {summaries[qa.id]}
                                        </p>
                                      </div>
                                    )}

                                    <div className="relative flex flex-wrap gap-2 pt-1">
                                      <button
                                        onClick={() => onStartEdit(qa)}
                                        className="app-button min-w-28 bg-teal-900 text-white hover:bg-teal-800"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => onSummary(qa)}
                                        disabled={summarizingId === qa.id}
                                        className="app-button min-w-36 border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        {summarizingId === qa.id ? 'Summarizing...' : 'Summary'}
                                      </button>
                                      <button
                                        onClick={() => onFlashcards(qa)}
                                        disabled={generatingFlashcardsId === qa.id}
                                        className="app-button min-w-36 border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        {generatingFlashcardsId === qa.id
                                          ? 'Generating...'
                                          : flashcardCounts[qa.id]
                                            ? 'More cards'
                                            : 'Flashcards'}
                                      </button>
                                      <button
                                        onClick={() => onDeleteRequest(qa)}
                                        className="app-button min-w-28 bg-red-600 text-white hover:bg-red-700"
                                      >
                                        Delete
                                      </button>
                                    </div>

                                    {draftFlashcards?.questionId === qa.id && (
                                      <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                          <div>
                                            <p className="text-sm font-semibold text-slate-800">Flashcards preview</p>
                                            <p className="mt-1 text-sm leading-6 text-stone-600">
                                              Review these cards, then save them if they look useful.
                                            </p>
                                          </div>
                                          <div className="flex flex-wrap gap-2">
                                            <button
                                              type="button"
                                              onClick={onSaveDraftFlashcards}
                                              disabled={savingFlashcardsId === qa.id}
                                              className="app-button min-h-10 bg-teal-900 px-3 text-xs text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                              {savingFlashcardsId === qa.id ? 'Saving...' : 'Save cards'}
                                            </button>
                                            <button
                                              type="button"
                                              onClick={onDiscardDraftFlashcards}
                                              disabled={savingFlashcardsId === qa.id}
                                              className="app-button min-h-10 border border-stone-200 bg-white px-3 text-xs text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                              Discard
                                            </button>
                                          </div>
                                        </div>

                                        <div className="mt-4 space-y-3">
                                          {draftFlashcards.cards.map((card, index) => (
                                            <article key={`${card.front}-${index}`} className="rounded-2xl border border-orange-100 bg-white p-4">
                                              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-700">
                                                Card {index + 1}
                                              </p>
                                              <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">
                                                {card.front}
                                              </p>
                                              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-600">
                                                {card.back}
                                              </p>
                                            </article>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </article>
                        )
                      })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
