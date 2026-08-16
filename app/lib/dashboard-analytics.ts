import type { FlashcardReviewEvent } from './questions'
import type { QuizHistoryItem } from './quizzes'

export type ChartPoint = { label: string; value: number; secondaryValue?: number }

function isoDate(value: string) {
  return new Date(value).toISOString().slice(0, 10)
}

function dateAtOffset(todayIso: string, offset: number) {
  const date = new Date(`${todayIso}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + offset)
  return date
}

export function buildReviewActivity(events: FlashcardReviewEvent[], todayIso: string, days: number): ChartPoint[] {
  const counts = new Map<string, number>()
  events.forEach((event) => {
    const day = isoDate(event.reviewedAt)
    counts.set(day, (counts.get(day) ?? 0) + 1)
  })
  return Array.from({ length: days }, (_, index) => {
    const date = dateAtOffset(todayIso, index - days + 1)
    const day = date.toISOString().slice(0, 10)
    return { label: days <= 7 ? date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }) : String(date.getUTCDate()), value: counts.get(day) ?? 0 }
  })
}

export function buildQuizResults(attempts: QuizHistoryItem[], todayIso: string): ChartPoint[] {
  const byDay = new Map<string, { score: number; count: number }>()
  attempts.forEach((attempt) => {
    const day = isoDate(attempt.completedAt)
    const current = byDay.get(day) ?? { score: 0, count: 0 }
    byDay.set(day, { score: current.score + attempt.score, count: current.count + 1 })
  })
  return Array.from({ length: 7 }, (_, index) => {
    const date = dateAtOffset(todayIso, index - 6)
    const day = date.toISOString().slice(0, 10)
    const value = byDay.get(day)
    return { label: date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }), value: value ? Math.round(value.score / value.count) : 0, secondaryValue: value?.count ?? 0 }
  })
}

export function getStudyStreak(events: FlashcardReviewEvent[], todayIso: string) {
  const dates = new Set(events.map((event) => isoDate(event.reviewedAt)))
  let streak = 0
  for (let offset = 0; dates.has(dateAtOffset(todayIso, -offset).toISOString().slice(0, 10)); offset += 1) streak += 1
  return streak
}
