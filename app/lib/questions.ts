import { supabase } from './supabase'

export interface QA {
  id: string
  question: string
  answer: string
  subject?: string
  created_at?: string
}

export type Flashcard = {
  id: string
  questionId: string | null
  subject: string
  front: string
  back: string
  reviewCount: number
  reviewedAt?: string | null
  nextReviewAt?: string | null
  intervalDays: number
  easeFactor: number
  createdAt?: string
}

type FlashcardRow = {
  id: string
  question_id: string | null
  subject: string
  front: string
  back: string
  review_count?: number | null
  reviewed_at?: string | null
  next_review_at?: string | null
  interval_days?: number | null
  ease_factor?: number | null
  created_at?: string
}

export type Subject = {
  id: string
  name: string
  createdAt?: string
}

type SubjectRow = {
  id: string
  name: string
  created_at?: string
}

export type ExamPlan = {
  id: string
  subject: string
  examDate: string
  goal: string
  plan: string
  createdAt?: string
}

type ExamPlanRow = {
  id: string
  subject: string
  exam_date: string
  goal: string | null
  plan: string
  created_at?: string
}

function mapExamPlan(row: ExamPlanRow): ExamPlan {
  return {
    id: row.id,
    subject: row.subject,
    examDate: row.exam_date,
    goal: row.goal ?? '',
    plan: row.plan,
    createdAt: row.created_at,
  }
}

function mapSubject(row: SubjectRow): Subject {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  }
}

function mapFlashcard(row: FlashcardRow): Flashcard {
  return {
    id: row.id,
    questionId: row.question_id,
    subject: row.subject,
    front: row.front,
    back: row.back,
    reviewCount: row.review_count ?? 0,
    reviewedAt: row.reviewed_at,
    nextReviewAt: row.next_review_at,
    intervalDays: Number(row.interval_days ?? 0),
    easeFactor: Number(row.ease_factor ?? 2.5),
    createdAt: row.created_at,
  }
}

export async function fetchFlashcards(userId: string) {
  const fullResult = await supabase
    .from('flashcards')
    .select('id, question_id, subject, front, back, review_count, reviewed_at, next_review_at, interval_days, ease_factor, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (!fullResult.error) {
    return {
      data: ((fullResult.data as FlashcardRow[] | null) ?? []).map(mapFlashcard),
      error: fullResult.error,
    }
  }

  const fallbackResult = await supabase
    .from('flashcards')
    .select('id, question_id, subject, front, back, review_count, reviewed_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return {
    data: ((fallbackResult.data as FlashcardRow[] | null) ?? []).map(mapFlashcard),
    error: fallbackResult.error,
  }
}

export async function createFlashcards(params: {
  userId: string
  questionId: string
  subject: string
  cards: Array<{ front: string; back: string }>
}) {
  const fullResult = await supabase
    .from('flashcards')
    .insert(
      params.cards.map((card) => ({
        user_id: params.userId,
        question_id: params.questionId,
        subject: params.subject,
        front: card.front,
        back: card.back,
      }))
    )
    .select('id, question_id, subject, front, back, review_count, reviewed_at, next_review_at, interval_days, ease_factor, created_at')

  if (!fullResult.error) {
    return {
      data: ((fullResult.data as FlashcardRow[] | null) ?? []).map(mapFlashcard),
      error: fullResult.error,
    }
  }

  const fallbackResult = await supabase
    .from('flashcards')
    .select('id, question_id, subject, front, back, created_at')
    .in('front', params.cards.map((card) => card.front))
    .eq('user_id', params.userId)
    .order('created_at', { ascending: false })

  return {
    data: ((fallbackResult.data as FlashcardRow[] | null) ?? []).map(mapFlashcard),
    error: fallbackResult.error,
  }
}

export type FlashcardRating = 'again' | 'hard' | 'good' | 'easy'

export function calculateFlashcardSchedule(card: Flashcard, rating: FlashcardRating) {
  const now = new Date()
  const previousInterval = Math.max(0, card.intervalDays ?? 0)
  const previousEase = Math.max(1.3, card.easeFactor ?? 2.5)
  const daysByRating: Record<FlashcardRating, number> = {
    again: 0,
    hard: previousInterval < 1 ? 1 : Math.max(1, Math.round(previousInterval * 1.2)),
    good: previousInterval < 1 ? 2 : Math.max(2, Math.round(previousInterval * previousEase)),
    easy: previousInterval < 1 ? 4 : Math.max(4, Math.round(previousInterval * (previousEase + 0.5))),
  }
  const nextReview = new Date(now)
  if (rating === 'again') nextReview.setMinutes(nextReview.getMinutes() + 10)
  else nextReview.setDate(nextReview.getDate() + daysByRating[rating])
  const easeChange: Record<FlashcardRating, number> = { again: -0.2, hard: -0.15, good: 0, easy: 0.15 }

  return {
    nextReviewAt: nextReview.toISOString(),
    intervalDays: daysByRating[rating],
    easeFactor: Math.min(3.5, Math.max(1.3, Number((previousEase + easeChange[rating]).toFixed(2)))),
  }
}

export async function reviewFlashcard(card: Flashcard, rating: FlashcardRating) {
  const schedule = calculateFlashcardSchedule(card, rating)
  const { data, error } = await supabase
    .from('flashcards')
    .update({
      review_count: card.reviewCount + 1,
      reviewed_at: new Date().toISOString(),
      next_review_at: schedule.nextReviewAt,
      interval_days: schedule.intervalDays,
      ease_factor: schedule.easeFactor,
    })
    .eq('id', card.id)
    .select('id, question_id, subject, front, back, review_count, reviewed_at, next_review_at, interval_days, ease_factor, created_at')
    .single()

  return {
    data: data ? mapFlashcard(data as FlashcardRow) : null,
    error,
  }
}

export async function deleteFlashcard(id: string) {
  return supabase.from('flashcards').delete().eq('id', id)
}

export async function fetchSubjects(userId: string) {
  const { data, error } = await supabase
    .from('subjects')
    .select('id, name, created_at')
    .eq('user_id', userId)
    .order('name', { ascending: true })

  return {
    data: ((data as SubjectRow[] | null) ?? []).map(mapSubject),
    error,
  }
}

export async function createSubject(params: {
  userId: string
  name: string
}) {
  const { data, error } = await supabase
    .from('subjects')
    .upsert(
      {
        user_id: params.userId,
        name: params.name,
      },
      { onConflict: 'user_id,name' }
    )
    .select('id, name, created_at')
    .single()

  return {
    data: data ? mapSubject(data as SubjectRow) : null,
    error,
  }
}

export async function deleteSubject(id: string) {
  return supabase.from('subjects').delete().eq('id', id)
}

export async function fetchQuestions(userId: string) {
  return supabase
    .from('questions')
    .select('id, question, answer, subject, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
}

export async function saveQuestion(params: {
  userId: string
  question: string
  answer: string
  subject: string
}) {
  return supabase
    .from('questions')
    .insert([
      {
        user_id: params.userId,
        question: params.question,
        answer: params.answer,
        subject: params.subject,
      },
    ])
    .select()
}

export async function updateQuestion(params: {
  id: string
  question: string
  subject: string
}) {
  return supabase
    .from('questions')
    .update({
      question: params.question,
      subject: params.subject,
    })
    .eq('id', params.id)
    .select()
}

export async function deleteQuestion(id: string) {
  return supabase.from('questions').delete().eq('id', id)
}

export async function fetchPinnedQuestionIds(userId: string) {
  const { data, error } = await supabase
    .from('pinned_questions')
    .select('question_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return {
    data: data?.map((item) => item.question_id as string) ?? [],
    error,
  }
}

export async function pinQuestion(userId: string, questionId: string) {
  return supabase
    .from('pinned_questions')
    .upsert(
      {
        user_id: userId,
        question_id: questionId,
      },
      { onConflict: 'user_id,question_id' }
    )
    .select()
}

export async function unpinQuestion(userId: string, questionId: string) {
  return supabase
    .from('pinned_questions')
    .delete()
    .eq('user_id', userId)
    .eq('question_id', questionId)
}

export async function fetchRevisionSummaries(userId: string) {
  const { data, error } = await supabase
    .from('revision_summaries')
    .select('question_id, summary')
    .eq('user_id', userId)

  return {
    data:
      data?.reduce<Record<string, string>>((acc, item) => {
        acc[item.question_id as string] = item.summary as string
        return acc
      }, {}) ?? {},
    error,
  }
}

export async function upsertRevisionSummary(params: {
  userId: string
  questionId: string
  summary: string
}) {
  return supabase
    .from('revision_summaries')
    .upsert(
      {
        user_id: params.userId,
        question_id: params.questionId,
        summary: params.summary,
      },
      { onConflict: 'user_id,question_id' }
    )
    .select('question_id, summary')
}

export async function fetchExamPlans(userId: string) {
  const { data, error } = await supabase
    .from('exam_plans')
    .select('id, subject, exam_date, goal, plan, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return {
    data: ((data as ExamPlanRow[] | null) ?? []).map(mapExamPlan),
    error,
  }
}

export async function createExamPlan(params: {
  userId: string
  subject: string
  examDate: string
  goal: string
  plan: string
}) {
  const { data, error } = await supabase
    .from('exam_plans')
    .insert([
      {
        user_id: params.userId,
        subject: params.subject,
        exam_date: params.examDate,
        goal: params.goal || null,
        plan: params.plan,
      },
    ])
    .select('id, subject, exam_date, goal, plan, created_at')
    .single()

  return {
    data: data ? mapExamPlan(data as ExamPlanRow) : null,
    error,
  }
}

export async function deleteExamPlan(id: string) {
  return supabase.from('exam_plans').delete().eq('id', id)
}
