import { ExamPlan, Flashcard, QA, Subject } from '../lib/questions'

export type { ExamPlan, Flashcard, QA, Subject }

export type StatusMessage = {
  type: 'success' | 'error'
  text: string
}

export type FilterMode = 'all' | 'pinned'

export type PromptSuggestion = {
  subject: string
  question: string
}
