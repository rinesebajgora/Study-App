import type { Flashcard } from './questions'
import type { QuizHistoryItem, TopicStat } from './quizzes'

export type KnowledgeProfile = {
  name: string
  score: number
  quizScore: number | null
  flashcardScore: number | null
  quizQuestions: number
  flashcards: number
  recommendation: string
}

function clamp(value: number) {
  return Math.round(Math.min(100, Math.max(0, value)))
}

function flashcardMastery(card: Flashcard) {
  if (card.reviewCount === 0) return 0
  const reviewProgress = Math.min(45, card.reviewCount * 9)
  const easeProgress = ((Math.min(3.5, Math.max(1.3, card.easeFactor)) - 1.3) / 2.2) * 35
  const isDue = !card.nextReviewAt || new Date(card.nextReviewAt).getTime() <= Date.now()
  return clamp(reviewProgress + easeProgress + (isDue ? 0 : 20))
}

function recommendation(score: number) {
  if (score < 45) return 'Prioritize this area: retry a quiz and review its flashcards.'
  if (score < 70) return 'Keep practising with a short quiz and the due flashcards.'
  return 'On track. Maintain the result with scheduled flashcard reviews.'
}

export function buildSubjectKnowledgeProfiles(subjects: string[], flashcards: Flashcard[], attempts: QuizHistoryItem[]): KnowledgeProfile[] {
  return subjects.map((name) => {
    const cards = flashcards.filter((card) => (card.subject || 'General') === name)
    const subjectAttempts = attempts.filter((attempt) => attempt.subject === name)
    const quizQuestions = subjectAttempts.reduce((sum, attempt) => sum + attempt.totalQuestions, 0)
    const correctAnswers = subjectAttempts.reduce((sum, attempt) => sum + attempt.correctAnswers, 0)
    const quizScore = quizQuestions ? clamp((correctAnswers / quizQuestions) * 100) : null
    const flashcardScore = cards.length ? clamp(cards.reduce((sum, card) => sum + flashcardMastery(card), 0) / cards.length) : null
    const score = quizScore !== null && flashcardScore !== null ? clamp(quizScore * 0.7 + flashcardScore * 0.3) : quizScore ?? flashcardScore ?? 0
    return { name, score, quizScore, flashcardScore, quizQuestions, flashcards: cards.length, recommendation: recommendation(score) }
  }).filter((profile) => profile.quizQuestions > 0 || profile.flashcards > 0)
    .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name))
}

export function buildTopicKnowledgeProfiles(topics: TopicStat[]): KnowledgeProfile[] {
  return topics.map((topic) => {
    const score = topic.total ? clamp(((topic.total - topic.incorrect) / topic.total) * 100) : 0
    return { name: topic.topic, score, quizScore: score, flashcardScore: null, quizQuestions: topic.total, flashcards: 0, recommendation: recommendation(score) }
  }).sort((a, b) => a.score - b.score || a.name.localeCompare(b.name))
}
