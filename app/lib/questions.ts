import { supabase } from './supabase'

export interface QA {
  id: string
  question: string
  answer: string
  subject?: string
}

export async function fetchQuestions(userId: string) {
  return supabase
    .from('questions')
    .select('id, question, answer, subject')
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
