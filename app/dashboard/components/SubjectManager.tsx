'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { Flashcard, QA } from '../types'
import EmptyState from './EmptyState'

export type SubjectCard = {
  name: string
  noteCount: number
  examPlanCount: number
  pinnedCount: number
  nextExamDate?: string
  managedId?: string
}

type SubjectManagerProps = {
  subjects: SubjectCard[]
  subjectName: string
  creating: boolean
  syncing: boolean
  activeFilter: string
  notes: QA[]
  flashcards: Flashcard[]
  pinnedIds: string[]
  onSubjectNameChange: (value: string) => void
  onCreateSubject: (event: FormEvent<HTMLFormElement>) => void
  onFilterSubject: (value: string) => void
  onDeleteManagedSubject: (id: string) => void
}

export default function SubjectManager({
  subjects,
  subjectName,
  creating,
  syncing,
  activeFilter,
  notes,
  flashcards,
  pinnedIds,
  onSubjectNameChange,
  onCreateSubject,
  onFilterSubject,
  onDeleteManagedSubject,
}: SubjectManagerProps) {
  const [openNoteIds, setOpenNoteIds] = useState<string[]>([])
  const [openCardIds, setOpenCardIds] = useState<string[]>([])
  const materialRef = useRef<HTMLDivElement>(null)
  const selectedSubject = activeFilter === 'All' ? null : activeFilter
  const selectedNotes = selectedSubject
    ? notes.filter((note) => (note.subject || 'General') === selectedSubject)
    : []
  const selectedFlashcards = selectedSubject
    ? flashcards.filter((card) => (card.subject || 'General') === selectedSubject)
    : []
  const toggleOpenNote = (id: string) => {
    setOpenNoteIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [id, ...prev]))
  }
  const toggleOpenCard = (id: string) => {
    setOpenCardIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [id, ...prev]))
  }

  useEffect(() => {
    if (!selectedSubject || syncing) return
    const scrollTimer = window.setTimeout(() => {
      materialRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)

    return () => window.clearTimeout(scrollTimer)
  }, [selectedSubject, syncing])

  return (
    <section className="surface-panel rounded-3xl border border-stone-200/80 bg-white/96 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Subjects</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Create study subjects, then attach notes and exam plans to the same names.
          </p>
        </div>
        <span className="rounded-full bg-teal-50 px-4 py-2 text-xs font-semibold text-teal-800">
          {syncing ? 'Syncing' : `${subjects.length} active`}
        </span>
      </div>

      <form onSubmit={onCreateSubject} className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">New subject</span>
          <input
            value={subjectName ?? ''}
            onChange={(event) => onSubjectNameChange(event.target.value)}
            placeholder="Math, Biology, English..."
            className="h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-slate-900 outline-none transition placeholder:text-stone-400 focus:border-teal-700"
            disabled={creating}
          />
        </label>
        <button
          type="submit"
          disabled={creating || !subjectName.trim()}
          className="app-button self-end bg-teal-900 text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {creating ? 'Adding...' : 'Add subject'}
        </button>
      </form>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {syncing ? (
          [0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-52 animate-pulse rounded-3xl border border-stone-200 bg-stone-100"
            />
          ))
        ) : subjects.length === 0 ? (
          <div className="md:col-span-2 xl:col-span-3">
            <EmptyState
              title="No subjects yet."
              description="Add a subject like Programming, Biology, or Math to group notes, plans, and flashcards."
            />
          </div>
        ) : (
          subjects.map((subject) => {
            const selected = activeFilter === subject.name

            return (
              <article
                key={subject.name}
                data-subject-id={encodeURIComponent(subject.name)}
                onClick={() => onFilterSubject(subject.name)}
                className={`rounded-3xl border p-4 transition ${
                  selected ? 'border-teal-700 bg-teal-50' : 'cursor-pointer border-stone-200 bg-stone-50 hover:border-teal-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">
                      Subject
                    </p>
                    <h3 className="mt-2 truncate text-lg font-semibold">{subject.name}</h3>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    ['Notes', subject.noteCount],
                    ['Plans', subject.examPlanCount],
                    ['Pinned', subject.pinnedCount],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl bg-white px-3 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                        {label}
                      </p>
                      <p className="mt-2 text-lg font-semibold">{value}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-4 min-h-6 text-sm leading-6 text-stone-600">
                  {subject.nextExamDate ? `Next exam: ${subject.nextExamDate}` : 'No exam date yet'}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      onFilterSubject(subject.name)
                    }}
                    className="app-button min-h-10 border border-stone-200 bg-white px-3 text-xs text-stone-700 hover:bg-stone-50"
                  >
                    {selected ? 'Unselect' : 'View material'}
                  </button>
                  {subject.managedId && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        onDeleteManagedSubject(subject.managedId as string)
                      }}
                      className="app-button min-h-10 bg-red-600 px-3 text-xs text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </article>
            )
          })
        )}
      </div>

      {selectedSubject && !syncing && (
        <div ref={materialRef} tabIndex={-1} className="mt-6 scroll-mt-24 rounded-3xl border border-stone-200 bg-stone-50 p-4 outline-none">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">
                {selectedSubject}
              </p>
              <h3 className="mt-2 text-lg font-semibold">Notes and flashcards</h3>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-600">
              {selectedNotes.length} notes | {selectedFlashcards.length} cards
            </span>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-800">
                Notes
              </h4>
              <div className="mt-3 space-y-3">
                {selectedNotes.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-4 text-sm text-stone-600">
                    No notes saved for this subject yet.
                  </div>
                ) : (
                  selectedNotes.map((note) => {
                    const open = openNoteIds.includes(note.id)

                    return (
                      <article key={note.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                        <button
                          type="button"
                          onClick={() => toggleOpenNote(note.id)}
                          className="w-full text-left"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h5 className="text-sm font-semibold leading-6 text-slate-900">{note.question}</h5>
                            <div className="flex flex-wrap gap-2">
                              {pinnedIds.includes(note.id) && (
                                <span className="rounded-full bg-teal-100 px-2.5 py-1 text-[11px] font-semibold text-teal-800">
                                  Pinned
                                </span>
                              )}
                              <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-600">
                                {open ? 'Hide' : 'Open'}
                              </span>
                            </div>
                          </div>
                        </button>
                        {open && (
                          <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-stone-50 p-4 text-sm leading-7 text-stone-700">
                            {note.answer}
                          </p>
                        )}
                      </article>
                    )
                  })
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-800">
                Flashcards
              </h4>
              <div className="mt-3 space-y-3">
                {selectedFlashcards.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-4 text-sm text-stone-600">
                    No flashcards generated for this subject yet.
                  </div>
                ) : (
                  selectedFlashcards.map((card) => {
                    const open = openCardIds.includes(card.id)

                    return (
                    <article key={card.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                          Card
                        </p>
                        {card.reviewCount > 0 && (
                          <span className="rounded-full bg-teal-100 px-2.5 py-1 text-[11px] font-semibold text-teal-800">
                            Reviewed {card.reviewCount}x
                          </span>
                        )}
                      </div>
                      <h5 className="mt-2 text-sm font-semibold leading-6 text-slate-900">{card.front}</h5>
                      {open && (
                        <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-stone-50 p-4 text-sm leading-7 text-stone-700">
                          {card.back}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleOpenCard(card.id)}
                        className="app-button mt-3 min-h-10 border border-stone-200 bg-white px-3 text-xs text-stone-700 hover:bg-stone-50"
                      >
                        {open ? 'Hide answer' : 'Show answer'}
                      </button>
                    </article>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
