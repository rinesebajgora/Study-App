'use client'

import { useEffect, useMemo, useState } from 'react'
import { Flashcard } from '../types'
import { calculateFlashcardSchedule, FlashcardRating } from '../../lib/questions'
import EmptyState from './EmptyState'

type FlashcardsPanelProps = {
  flashcards: Flashcard[]
  syncing: boolean
  deletingId: string | null
  focusedFlashcardId: string | null
  reviewingId: string | null
  onOpenNotes: () => void
  onRate: (card: Flashcard, rating: FlashcardRating) => void
  onDelete: (id: string) => void
}

const reviewIntervals = [0, 1, 3, 7, 14, 30]

function startOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

function addDays(date: Date, days: number) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

function getNextReviewDate(card: Flashcard) {
  if (card.nextReviewAt) return new Date(card.nextReviewAt)
  if (!card.reviewedAt) return startOfToday()

  const reviewedDate = new Date(card.reviewedAt)
  const interval = reviewIntervals[Math.min(card.reviewCount, reviewIntervals.length - 1)]
  return addDays(reviewedDate, interval)
}

function getCardStatus(card: Flashcard) {
  const due = getNextReviewDate(card) <= new Date()
  if (card.reviewCount >= 5 && !due) return 'mastered'
  if (due) return 'due'
  return 'reviewed'
}

function getStatusStyle(status: string) {
  if (status === 'mastered') return 'bg-teal-900 text-white'
  if (status === 'due') return 'bg-orange-100 text-orange-700'
  return 'bg-teal-100 text-teal-800'
}

export default function FlashcardsPanel({
  flashcards,
  syncing,
  deletingId,
  focusedFlashcardId,
  reviewingId,
  onOpenNotes,
  onRate,
  onDelete,
}: FlashcardsPanelProps) {
  const [openIds, setOpenIds] = useState<string[]>([])

  const grouped = useMemo(
    () =>
      Array.from(new Set(flashcards.map((card) => card.subject || 'General')))
        .sort((a, b) => a.localeCompare(b))
        .map((subject) => ({
          subject,
          cards: flashcards.filter((card) => (card.subject || 'General') === subject),
        })),
    [flashcards]
  )
  const dueTodayCards = useMemo(
    () => flashcards.filter((card) => getNextReviewDate(card) <= new Date()),
    [flashcards]
  )

  useEffect(() => {
    if (!focusedFlashcardId) return
    const focusTimer = window.setTimeout(() => {
      setOpenIds((prev) => (prev.includes(focusedFlashcardId) ? prev : [focusedFlashcardId, ...prev]))
      document.querySelector(`[data-flashcard-id="${focusedFlashcardId}"]`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 0)

    return () => window.clearTimeout(focusTimer)
  }, [focusedFlashcardId])

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [id, ...prev]))
  }

  const reviewedCount = flashcards.filter((card) => card.reviewCount > 0).length
  const masteredCount = flashcards.filter((card) => getCardStatus(card) === 'mastered').length

  const renderCard = (card: Flashcard) => {
    const open = openIds.includes(card.id)
    const status = getCardStatus(card)
    const nextReviewDate = getNextReviewDate(card)
    const nextReviewLabel = nextReviewDate <= new Date() ? 'Due now' : `Due ${nextReviewDate.toLocaleDateString()}`

    return (
      <article
        key={card.id}
        data-flashcard-id={card.id}
        className={`rounded-3xl border p-4 ${
          status === 'due'
            ? 'border-orange-200 bg-orange-50'
            : status === 'mastered'
              ? 'border-teal-200 bg-teal-50/80'
              : 'border-stone-200 bg-stone-50'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Prompt
              </p>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${getStatusStyle(status)}`}>
                {status}
              </span>
              {card.reviewCount > 0 && (
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-stone-600">
                  Reviewed {card.reviewCount}x
                </span>
              )}
            </div>
            <h4 className="mt-2 text-sm font-semibold leading-6 text-slate-900">
              {card.front}
            </h4>
            <p className="mt-2 text-xs text-stone-500">
              {card.reviewedAt ? `Last reviewed ${new Date(card.reviewedAt).toLocaleDateString()} · ${nextReviewLabel}` : 'New card · Due today'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onDelete(card.id)}
            disabled={deletingId === card.id}
            className="app-button min-h-9 shrink-0 border border-stone-200 bg-white px-3 text-xs text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deletingId === card.id ? 'Deleting...' : 'Delete'}
          </button>
        </div>

        {open && (
          <div className="mt-4 rounded-2xl border border-teal-100 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-800">
              Answer
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {card.back}
            </p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => toggleOpen(card.id)}
            className="app-button min-h-10 bg-teal-900 px-3 text-xs text-white hover:bg-teal-800"
          >
            {open ? 'Hide answer' : 'Show answer'}
          </button>
          {open && (
            <>
              {(['again', 'hard', 'good', 'easy'] as FlashcardRating[]).map((rating) => {
                const schedule = calculateFlashcardSchedule(card, rating)
                const scheduleLabel = rating === 'again' ? '10 min' : `${schedule.intervalDays} day${schedule.intervalDays === 1 ? '' : 's'}`
                const tone = rating === 'again'
                  ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                  : rating === 'hard'
                    ? 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'
                    : rating === 'good'
                      ? 'border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100'
                      : 'border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100'

                return (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => onRate(card, rating)}
                    disabled={reviewingId === card.id}
                    className={`app-button min-h-10 border px-3 text-xs capitalize disabled:cursor-not-allowed disabled:opacity-60 ${tone}`}
                  >
                    {reviewingId === card.id ? 'Saving...' : `${rating} · ${scheduleLabel}`}
                  </button>
                )
              })}
            </>
          )}
        </div>
      </article>
    )
  }

  return (
    <section className="surface-panel rounded-3xl border border-stone-200/80 bg-white/96 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Flashcards</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Generate cards from saved notes, then review them by subject.
          </p>
        </div>
        <span className="rounded-full bg-teal-50 px-4 py-2 text-xs font-semibold text-teal-800">
          {syncing ? 'Syncing' : `${dueTodayCards.length} due today`}
        </span>
      </div>

      {!syncing && flashcards.length > 0 && (
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            ['Reviewed', `${reviewedCount}/${flashcards.length}`],
            ['Due today', `${dueTodayCards.length}`],
            ['Mastered', `${masteredCount}`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        {syncing ? (
          <div className="grid gap-3 md:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-40 animate-pulse rounded-3xl border border-stone-200 bg-stone-100"
              />
            ))}
          </div>
        ) : flashcards.length === 0 ? (
          <EmptyState
            title="No flashcards yet."
            description="Open a saved note, then use Flashcards to create active-recall questions from it."
            actions={[{ label: 'Open study notes', onClick: onOpenNotes }]}
          />
        ) : (
          <div className="space-y-5">
            <div className="rounded-3xl border border-orange-200 bg-orange-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-800">Due today</h3>
                  <p className="mt-1 text-xs leading-5 text-orange-800">Reveal the answer, then rate how difficult it felt.</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-orange-700">{dueTodayCards.length} cards</span>
              </div>
              {dueTodayCards.length === 0 ? (
                <p className="mt-4 rounded-2xl bg-white p-3 text-sm text-stone-600">Nothing is due right now. Your next review dates will appear here.</p>
              ) : (
                <div className="mt-4 grid gap-3 md:grid-cols-2">{dueTodayCards.map(renderCard)}</div>
              )}
            </div>
            {grouped.map((group) => (
              <div key={group.subject}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-800">
                      {group.subject}
                    </h3>
                    <p className="mt-1 text-xs text-stone-500">
                      {group.cards.filter((card) => card.reviewCount > 0).length}/{group.cards.length} reviewed · {group.cards.filter((card) => getCardStatus(card) === 'due').length} due
                    </p>
                  </div>
                  <span className="text-xs text-stone-500">
                    {Math.round((group.cards.filter((card) => card.reviewCount > 0).length / group.cards.length) * 100)}%
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {group.cards.map(renderCard)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
