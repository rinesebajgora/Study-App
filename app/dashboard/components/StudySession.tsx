'use client'

import { useMemo, useState } from 'react'
import { Flashcard, QA } from '../types'
import EmptyState from './EmptyState'

type StudySessionProps = {
  subject: string
  notes: QA[]
  flashcards: Flashcard[]
  onClose: () => void
  onOpenNotes: () => void
}

type StudyItem = {
  id: string
  type: 'note' | 'flashcard'
  prompt: string
  answer: string
}

type SessionResult = {
  id: string
  correct: boolean
}

export default function StudySession({
  subject,
  notes,
  flashcards,
  onClose,
  onOpenNotes,
}: StudySessionProps) {
  const items = useMemo<StudyItem[]>(() => {
    const noteItems = notes.map((note) => ({
      id: `note-${note.id}`,
      type: 'note' as const,
      prompt: note.question,
      answer: note.answer,
    }))
    const cardItems = flashcards.map((card) => ({
      id: `flashcard-${card.id}`,
      type: 'flashcard' as const,
      prompt: card.front,
      answer: card.back,
    }))
    const mixed: StudyItem[] = []
    const maxLength = Math.max(noteItems.length, cardItems.length)

    for (let index = 0; index < maxLength; index += 1) {
      if (cardItems[index]) mixed.push(cardItems[index])
      if (noteItems[index]) mixed.push(noteItems[index])
    }

    return mixed
  }, [flashcards, notes])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [results, setResults] = useState<SessionResult[]>([])
  const [finished, setFinished] = useState(false)

  const current = items[currentIndex]
  const correctCount = results.filter((result) => result.correct).length
  const incorrectCount = results.length - correctCount
  const progress = items.length === 0 ? 0 : Math.round((results.length / items.length) * 100)

  const recordAnswer = (correct: boolean) => {
    if (!current) return

    const nextResults = [...results, { id: current.id, correct }]
    setResults(nextResults)
    setRevealed(false)

    if (currentIndex >= items.length - 1) {
      setFinished(true)
      return
    }

    setCurrentIndex((index) => index + 1)
  }

  const restart = () => {
    setCurrentIndex(0)
    setRevealed(false)
    setResults([])
    setFinished(false)
  }

  if (items.length === 0) {
    return (
      <section className="surface-panel rounded-3xl border border-stone-200/80 bg-white/96 p-5 sm:p-6">
        <EmptyState
          title={`No study material for ${subject} yet.`}
          description="Add notes or generate flashcards for this subject before starting a study session."
          actions={[
            { label: 'Open study notes', onClick: onOpenNotes },
            { label: 'Back to subjects', onClick: onClose },
          ]}
        />
      </section>
    )
  }

  if (finished) {
    const score = Math.round((correctCount / items.length) * 100)

    return (
      <section className="surface-panel rounded-3xl border border-stone-200/80 bg-white/96 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">Study session</p>
            <h2 className="mt-2 text-xl font-semibold">{subject} summary</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Review how this session went, then restart or return to your subjects.
            </p>
          </div>
          <span className="rounded-full bg-teal-50 px-4 py-2 text-xs font-semibold text-teal-800">
            {score}% score
          </span>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            ['Reviewed', items.length],
            ['Correct', correctCount],
            ['Incorrect', incorrectCount],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={restart}
            className="app-button min-h-10 bg-teal-900 px-4 text-sm text-white hover:bg-teal-800"
          >
            Restart session
          </button>
          <button
            type="button"
            onClick={onClose}
            className="app-button min-h-10 border border-stone-200 bg-white px-4 text-sm text-stone-700 hover:bg-stone-50"
          >
            Back to subjects
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="surface-panel rounded-3xl border border-stone-200/80 bg-white/96 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">Study session</p>
          <h2 className="mt-2 text-xl font-semibold">{subject}</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Work through one prompt at a time, reveal the answer, then mark yourself correct or incorrect.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="app-button min-h-10 border border-stone-200 bg-white px-4 text-sm text-stone-700 hover:bg-stone-50"
        >
          Exit
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-800">
            {currentIndex + 1} of {items.length}
          </p>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-600">
            {current?.type === 'flashcard' ? 'Flashcard' : 'Note'}
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
          <div className="h-full rounded-full bg-teal-700" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <article className="mt-5 rounded-3xl border border-teal-200 bg-teal-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-800">Prompt</p>
        <h3 className="mt-3 text-lg font-semibold leading-8 text-slate-900">{current.prompt}</h3>

        {revealed ? (
          <div className="mt-5 rounded-2xl border border-teal-100 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-800">Answer</p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{current.answer}</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="app-button mt-5 min-h-10 bg-teal-900 px-4 text-sm text-white hover:bg-teal-800"
          >
            Show answer
          </button>
        )}

        {revealed && (
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => recordAnswer(true)}
              className="app-button min-h-10 bg-teal-900 px-4 text-sm text-white hover:bg-teal-800"
            >
              Correct
            </button>
            <button
              type="button"
              onClick={() => recordAnswer(false)}
              className="app-button min-h-10 bg-red-600 px-4 text-sm text-white hover:bg-red-700"
            >
              Incorrect
            </button>
          </div>
        )}
      </article>
    </section>
  )
}
