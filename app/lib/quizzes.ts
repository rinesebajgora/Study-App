import { supabase } from './supabase'
import type { QuizQuestion } from '../dashboard/components/QuizPanel'

export type QuizHistoryItem = {
  id: string
  subject: string
  title: string
  score: number
  correctAnswers: number
  totalQuestions: number
  durationSeconds: number
  completedAt: string
}

export type TopicStat = {
  topic: string
  total: number
  incorrect: number
}

type QuizRow = { id: string }
type AttemptRow = {
  id: string
  score: number
  correct_answers: number
  total_questions: number
  duration_seconds: number
  completed_at: string
  quizzes: { subject: string; title: string } | { subject: string; title: string }[] | null
}

export async function createQuiz(params: {
  userId: string
  subject: string
  title: string
  sourceType: 'note' | 'subject' | 'material'
  questions: QuizQuestion[]
}) {
  const { data, error } = await supabase
    .from('quizzes')
    .insert({
      user_id: params.userId,
      subject: params.subject,
      title: params.title,
      source_type: params.sourceType,
      questions: params.questions,
    })
    .select('id')
    .single()

  return { data: data as QuizRow | null, error }
}

export async function saveQuizAttempt(params: {
  userId: string
  quizId: string
  score: number
  correctAnswers: number
  totalQuestions: number
  durationSeconds: number
  answers: Array<{
    questionId: string
    questionText: string
    questionType: QuizQuestion['type']
    topic: string
    selectedAnswer: string
    correctAnswer: string
    isCorrect: boolean
  }>
}) {
  const { data: attempt, error: attemptError } = await supabase
    .from('quiz_attempts')
    .insert({
      user_id: params.userId,
      quiz_id: params.quizId,
      score: params.score,
      correct_answers: params.correctAnswers,
      total_questions: params.totalQuestions,
      duration_seconds: params.durationSeconds,
    })
    .select('id, score, correct_answers, total_questions, duration_seconds, completed_at')
    .single()

  if (attemptError || !attempt) return { data: null, error: attemptError }

  const { error: answerError } = await supabase.from('quiz_attempt_answers').insert(
    params.answers.map((answer) => ({
      user_id: params.userId,
      quiz_attempt_id: attempt.id,
      question_id: answer.questionId,
      question_text: answer.questionText,
      question_type: answer.questionType,
      topic: answer.topic,
      selected_answer: answer.selectedAnswer,
      correct_answer: answer.correctAnswer,
      is_correct: answer.isCorrect,
    }))
  )

  if (answerError) return { data: null, error: answerError }
  return { data: attempt, error: null }
}

export async function fetchQuizAnalytics(userId: string) {
  const [historyResult, answersResult] = await Promise.all([
    supabase
      .from('quiz_attempts')
      .select('id, score, correct_answers, total_questions, duration_seconds, completed_at, quizzes(subject, title)')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(10),
    supabase
      .from('quiz_attempt_answers')
      .select('topic, is_correct')
      .eq('user_id', userId),
  ])

  const history = ((historyResult.data as AttemptRow[] | null) ?? []).map((item) => {
    const quiz = Array.isArray(item.quizzes) ? item.quizzes[0] : item.quizzes
    return {
      id: item.id,
      subject: quiz?.subject ?? 'General',
      title: quiz?.title ?? 'Quiz',
      score: item.score,
      correctAnswers: item.correct_answers,
      totalQuestions: item.total_questions,
      durationSeconds: item.duration_seconds,
      completedAt: item.completed_at,
    }
  })

  const topicMap = new Map<string, TopicStat>()
  for (const item of answersResult.data ?? []) {
    const topic = String(item.topic || 'General').trim() || 'General'
    const current = topicMap.get(topic) ?? { topic, total: 0, incorrect: 0 }
    current.total += 1
    if (!item.is_correct) current.incorrect += 1
    topicMap.set(topic, current)
  }

  return {
    history,
    topics: [...topicMap.values()].filter((item) => item.incorrect > 0).sort((a, b) => b.incorrect - a.incorrect || b.total - a.total).slice(0, 5),
    error: historyResult.error || answersResult.error,
  }
}
