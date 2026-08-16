import type { FlashcardReviewEvent } from './questions'
import type { QuizHistoryItem } from './quizzes'

export type Badge = {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
}

export type DailyGoal = {
  id: string
  label: string
  progress: number
  target: number
  unit: string
}

export type GamificationProfile = {
  points: number
  level: number
  pointsIntoLevel: number
  pointsForNextLevel: number
  badges: Badge[]
  dailyGoals: DailyGoal[]
}

function toIsoDate(value: string) {
  return new Date(value).toISOString().slice(0, 10)
}

export function buildGamificationProfile(params: {
  reviewEvents: FlashcardReviewEvent[]
  reviewCount: number
  quizHistory: QuizHistoryItem[]
  studyStreak: number
  todayIso: string
}): GamificationProfile {
  const trackedReviews = params.reviewEvents.length || params.reviewCount
  const highScoreQuizzes = params.quizHistory.filter((attempt) => attempt.score >= 90)
  const points = trackedReviews * 10 + params.quizHistory.length * 30 + highScoreQuizzes.length * 50 + Math.floor(params.studyStreak / 7) * 40
  const pointsForNextLevel = 250
  const level = Math.floor(points / pointsForNextLevel) + 1
  const reviewedToday = params.reviewEvents.filter((event) => toIsoDate(event.reviewedAt) === params.todayIso).length
  const quizzesToday = params.quizHistory.filter((attempt) => toIsoDate(attempt.completedAt) === params.todayIso)
  const highScoreToday = quizzesToday.filter((attempt) => attempt.score >= 80).length
  const dailyGoals: DailyGoal[] = [
    { id: 'review', label: 'Review flashcards', progress: reviewedToday, target: 10, unit: 'cards' },
    { id: 'quiz', label: 'Complete a quiz', progress: quizzesToday.length, target: 1, unit: 'quiz' },
    { id: 'accuracy', label: 'Score 80%+ in a quiz', progress: highScoreToday, target: 1, unit: 'quiz' },
  ]
  const completedGoals = dailyGoals.filter((goal) => goal.progress >= goal.target).length
  const badges: Badge[] = [
    { id: 'streak-7', name: 'Week warrior', description: 'Study for 7 days in a row.', icon: '🔥', unlocked: params.studyStreak >= 7 },
    { id: 'reviews-100', name: 'Card century', description: 'Complete 100 flashcard reviews.', icon: '🃏', unlocked: trackedReviews >= 100 },
    { id: 'quiz-ace', name: 'Quiz ace', description: 'Score 90% or higher in a quiz.', icon: '🏆', unlocked: highScoreQuizzes.length > 0 },
    { id: 'daily-goals', name: 'Daily finisher', description: 'Complete all daily goals.', icon: '✨', unlocked: completedGoals === dailyGoals.length },
  ]

  return {
    points,
    level,
    pointsIntoLevel: points % pointsForNextLevel,
    pointsForNextLevel,
    badges,
    dailyGoals,
  }
}
