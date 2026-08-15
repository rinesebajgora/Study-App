import type { ExamPlan, Flashcard } from './questions'
import type { KnowledgeProfile } from './knowledge'

export type DailyRecommendation = {
  subject: string | null
  reason: string
  flashcardCount: number
  dueFlashcards: number
  quizLabel: string
  examLabel: string | null
}

function daysUntil(date: string, todayIso: string) {
  const start = new Date(`${todayIso}T00:00:00Z`).getTime()
  const end = new Date(`${date.slice(0, 10)}T00:00:00Z`).getTime()
  return Math.round((end - start) / 86400000)
}

function isDue(card: Flashcard) {
  return !card.nextReviewAt || new Date(card.nextReviewAt).getTime() <= Date.now()
}

export function buildDailyRecommendation(params: {
  subjectProfiles: KnowledgeProfile[]
  topicProfiles: KnowledgeProfile[]
  flashcards: Flashcard[]
  examPlans: ExamPlan[]
  todayIso: string
}): DailyRecommendation {
  const upcomingExams = params.examPlans
    .map((plan) => ({ plan, days: daysUntil(plan.examDate, params.todayIso) }))
    .filter((item) => item.days >= 0)
    .sort((a, b) => a.days - b.days)
  const profileBySubject = new Map(params.subjectProfiles.map((profile) => [profile.name, profile]))
  const candidateSubjects = new Set([...params.subjectProfiles.map((profile) => profile.name), ...upcomingExams.map((item) => item.plan.subject)])

  const ranked = [...candidateSubjects].map((subject) => {
    const profile = profileBySubject.get(subject)
    const exam = upcomingExams.find((item) => item.plan.subject === subject)
    const urgency = exam ? Math.max(0, 35 - Math.min(35, exam.days * 2)) : 0
    return { subject, profile, exam, priority: (100 - (profile?.score ?? 50)) + urgency }
  }).sort((a, b) => b.priority - a.priority || a.subject.localeCompare(b.subject))

  const target = ranked[0]
  if (!target) {
    return { subject: null, reason: 'Create flashcards or complete a quiz to receive a personalised daily plan.', flashcardCount: 0, dueFlashcards: 0, quizLabel: 'Create your first quiz', examLabel: null }
  }

  const subjectCards = params.flashcards.filter((card) => (card.subject || 'General') === target.subject)
  const dueFlashcards = subjectCards.filter(isDue).length
  const flashcardCount = subjectCards.length === 0 ? 0 : Math.min(Math.max(dueFlashcards, 8), 20, subjectCards.length)
  const weakTopic = params.topicProfiles[0]
  const examLabel = target.exam ? `${target.exam.days === 0 ? 'Exam today' : `Exam in ${target.exam.days} day${target.exam.days === 1 ? '' : 's'}`}: ${target.exam.plan.subject}` : null
  const reason = target.exam
    ? `${examLabel}. ${target.profile ? `Current knowledge: ${target.profile.score}%.` : 'Build confidence with a focused review.'}`
    : `This is your lowest current knowledge score (${target.profile?.score ?? 0}%).`

  return {
    subject: target.subject,
    reason,
    flashcardCount,
    dueFlashcards,
    quizLabel: weakTopic ? `Take a ${target.subject} quiz and focus on “${weakTopic.name}”` : `Take a short ${target.subject} quiz`,
    examLabel,
  }
}
