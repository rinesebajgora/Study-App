'use client'

import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Protected from '../components/Protected'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  createFlashcards,
  createSubject,
  createExamPlan,
  deleteFlashcard,
  deleteExamPlan,
  deleteQuestion,
  deleteSubject,
  ExamPlan,
  fetchFlashcards,
  fetchExamPlans,
  fetchPinnedQuestionIds,
  fetchQuestions,
  fetchRevisionSummaries,
  fetchSubjects,
  Flashcard,
  FlashcardRating,
  pinQuestion,
  QA,
  saveQuestion,
  reviewFlashcard,
  Subject,
  unpinQuestion,
  updateQuestion,
  upsertRevisionSummary,
} from '../lib/questions'
import { createQuiz, fetchQuizAnalytics, QuizHistoryItem, saveQuizAttempt, TopicStat } from '../lib/quizzes'
import AskAiPanel from './components/AskAiPanel'
import DashboardOverview, { DashboardAnalytics, ProgressStats } from './components/DashboardOverview'
import DashboardSidebar from './components/DashboardSidebar'
import ExamPlanner, { DraftExamPlan } from './components/ExamPlanner'
import FlashcardsPanel from './components/FlashcardsPanel'
import GlobalSearch, { GlobalSearchResult } from './components/GlobalSearch'
import SavedLibrary from './components/SavedLibrary'
import SubjectManager, { SubjectCard } from './components/SubjectManager'
import ConfirmModal from './components/ConfirmModal'
import Toast from './components/Toast'
import OnboardingPanel from './components/OnboardingPanel'
import ProfileSettings from './components/ProfileSettings'
import ImportMaterial from './components/ImportMaterial'
import QuizPanel, { GeneratedQuiz, QuizQuestion } from './components/QuizPanel'
import { FilterMode, PromptSuggestion, StatusMessage } from './types'

type DraftFlashcards = {
  questionId: string
  subject: string
  cards: Array<{ front: string; back: string }>
}

type ImportPreview = {
  title: string
  note: string
  flashcards: Array<{ front: string; back: string }>
}

type DeleteTarget = {
  type: 'note' | 'subject' | 'flashcard' | 'exam-plan' | 'account'
  id: string
  title: string
  description: string
}

function clearDraft(
  setInput: React.Dispatch<React.SetStateAction<string>>,
  setSubject: React.Dispatch<React.SetStateAction<string>>,
  setAiResponse: React.Dispatch<React.SetStateAction<string>>,
  setTempDelete: React.Dispatch<React.SetStateAction<boolean>>
) {
  setAiResponse('')
  setInput('')
  setSubject('')
  setTempDelete(false)
}

function isMissingSubjectsTable(error: { message?: string; code?: string } | null | undefined) {
  return (
    error?.code === 'PGRST205' ||
    error?.message?.toLowerCase().includes("could not find the table 'public.subjects'") ||
    false
  )
}

function isMissingFlashcardsTable(error: { message?: string; code?: string } | null | undefined) {
  return (
    error?.code === 'PGRST205' ||
    error?.message?.toLowerCase().includes("could not find the table 'public.flashcards'") ||
    false
  )
}

function normalizeFlashcardFront(value: string) {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

function toDayNumber(isoDate: string) {
  const [year, month, day] = isoDate.slice(0, 10).split('-').map(Number)
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000)
}

function getIsoDate(value?: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : null
}

function isQuizSchemaMissing(error: { message?: string; code?: string } | null | undefined) {
  return error?.code === 'PGRST205' || error?.message?.toLowerCase().includes("could not find the table 'public.quiz") || false
}

function isQuizAnswerCorrect(question: QuizQuestion, answer: string) {
  const normalizedAnswer = answer.trim().toLowerCase()
  const normalizedCorrect = question.answer.trim().toLowerCase()
  if (question.type !== 'open') return normalizedAnswer === normalizedCorrect

  const expectedWords = normalizedCorrect.match(/[\p{L}\p{N}]{4,}/gu) ?? []
  if (expectedWords.length === 0) return normalizedAnswer === normalizedCorrect
  const answerWords = new Set(normalizedAnswer.match(/[\p{L}\p{N}]{4,}/gu) ?? [])
  const matches = expectedWords.filter((word) => answerWords.has(word)).length
  return matches / expectedWords.length >= 0.6
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [input, setInput] = useState('')
  const [subject, setSubject] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [savedQA, setSavedQA] = useState<QA[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingSaved, setFetchingSaved] = useState(true)
  const [status, setStatus] = useState<StatusMessage | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQuestion, setEditQuestion] = useState('')
  const [editSubject, setEditSubject] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [studyLevel, setStudyLevel] = useState('')
  const [studyPreference, setStudyPreference] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [tempDelete, setTempDelete] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [globalSearchTerm, setGlobalSearchTerm] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('All')
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [pinnedIds, setPinnedIds] = useState<string[]>([])
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const [focusedFlashcardId, setFocusedFlashcardId] = useState<string | null>(null)
  const [focusedExamPlanId, setFocusedExamPlanId] = useState<string | null>(null)
  const [summaries, setSummaries] = useState<Record<string, string>>({})
  const [summarizingId, setSummarizingId] = useState<string | null>(null)
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [draftFlashcards, setDraftFlashcards] = useState<DraftFlashcards | null>(null)
  const [generatingFlashcardsId, setGeneratingFlashcardsId] = useState<string | null>(null)
  const [savingFlashcardsId, setSavingFlashcardsId] = useState<string | null>(null)
  const [deletingFlashcardId, setDeletingFlashcardId] = useState<string | null>(null)
  const [reviewingFlashcardId, setReviewingFlashcardId] = useState<string | null>(null)

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectName, setSubjectName] = useState('')
  const [creatingSubject, setCreatingSubject] = useState(false)

  const [examPlans, setExamPlans] = useState<ExamPlan[]>([])
  const [examSubject, setExamSubject] = useState('')
  const [examDate, setExamDate] = useState('')
  const [examGoal, setExamGoal] = useState('')
  const [draftExamPlan, setDraftExamPlan] = useState<DraftExamPlan | null>(null)
  const [planningExam, setPlanningExam] = useState(false)
  const [savingExamPlan, setSavingExamPlan] = useState(false)
  const [importMaterial, setImportMaterial] = useState('')
  const [importFileMaterial, setImportFileMaterial] = useState('')
  const [importSubject, setImportSubject] = useState('')
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null)
  const [importingMaterial, setImportingMaterial] = useState(false)
  const [savingImport, setSavingImport] = useState(false)
  const [generatingQuiz, setGeneratingQuiz] = useState(false)
  const [quizHistory, setQuizHistory] = useState<QuizHistoryItem[]>([])
  const [weakQuizTopics, setWeakQuizTopics] = useState<TopicStat[]>([])
  const [todayIso] = useState(() => new Date().toISOString().slice(0, 10))

  useEffect(() => {
    const metadata = user?.user_metadata ?? {}
    setDisplayName(typeof metadata.display_name === 'string' ? metadata.display_name : '')
    setStudyLevel(typeof metadata.study_level === 'string' ? metadata.study_level : '')
    setStudyPreference(typeof metadata.study_preference === 'string' ? metadata.study_preference : '')
  }, [user])

  useEffect(() => {
    if (!user) {
      setSavedQA([])
      setPinnedIds([])
      setSummaries({})
      setFlashcards([])
      setDraftFlashcards(null)
      setSubjects([])
      setExamPlans([])
      setDraftExamPlan(null)
      setQuizHistory([])
      setWeakQuizTopics([])
      setFetchingSaved(false)
      return
    }

    const loadWorkspace = async () => {
      setFetchingSaved(true)
      const [questions, pins, revisionSummaries, managedSubjects, cards, plans, quizAnalytics] = await Promise.all([
        fetchQuestions(user.id),
        fetchPinnedQuestionIds(user.id),
        fetchRevisionSummaries(user.id),
        fetchSubjects(user.id),
        fetchFlashcards(user.id),
        fetchExamPlans(user.id),
        fetchQuizAnalytics(user.id),
      ])

      if (questions.error) {
        setStatus({ type: 'error', text: 'We could not load your saved notes right now.' })
      } else {
        setSavedQA((questions.data as QA[]) ?? [])
      }

      if (!pins.error) setPinnedIds(pins.data)
      if (!revisionSummaries.error) setSummaries(revisionSummaries.data)
      if (!managedSubjects.error) {
        setSubjects(managedSubjects.data)
      } else if (!isMissingSubjectsTable(managedSubjects.error)) {
        setStatus({ type: 'error', text: 'We could not load your subjects right now.' })
      }
      if (!cards.error) {
        setFlashcards(cards.data)
      } else if (!isMissingFlashcardsTable(cards.error)) {
        setStatus({ type: 'error', text: 'We could not load your flashcards right now.' })
      }
      if (!plans.error) setExamPlans(plans.data)
      if (!quizAnalytics.error) {
        setQuizHistory(quizAnalytics.history)
        setWeakQuizTopics(quizAnalytics.topics)
      }

      setFetchingSaved(false)
    }

    loadWorkspace()
  }, [user])

  useEffect(() => {
    if (!status) return

    const timer = window.setTimeout(() => {
      setStatus(null)
    }, 4500)

    return () => window.clearTimeout(timer)
  }, [status])

  const askAi = async (message: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      throw new Error('Your session expired. Please log in again.')
    }

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ message }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'The AI request failed. Please try again.')
    }

    return data.reply as string
  }

  const promptSuggestions: PromptSuggestion[] = [
    {
      subject: 'Biology',
      question: 'Explain photosynthesis in simple steps and create 5 revision questions.',
    },
    {
      subject: 'History',
      question: 'Create exam notes for the causes of World War I with key dates.',
    },
    {
      subject: 'Study plan',
      question: 'Create a simple weekly study routine for math, biology, and history.',
    },
    {
      subject: 'Exam prep',
      question: 'Create a 7-day exam revision plan with daily priorities and practice tasks.',
    },
  ]

  const allSubjects = useMemo(() => {
    const names = [
      ...subjects.map((item) => item.name),
      ...savedQA.map((qa) => qa.subject || 'General'),
      ...examPlans.map((plan) => plan.subject || 'General'),
    ]

    return Array.from(new Set(names.filter(Boolean))).sort((a, b) => a.localeCompare(b))
  }, [examPlans, savedQA, subjects])

  const filteredQA = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return savedQA
      .filter((qa) => {
        const qaSubject = qa.subject || 'General'
        const matchesSubject = subjectFilter === 'All' || qaSubject === subjectFilter
        const matchesMode = filterMode === 'all' || pinnedIds.includes(qa.id)
        const matchesSearch =
          !normalizedSearch ||
          qa.question.toLowerCase().includes(normalizedSearch) ||
          qa.answer.toLowerCase().includes(normalizedSearch) ||
          qaSubject.toLowerCase().includes(normalizedSearch)

        return matchesSubject && matchesMode && matchesSearch
      })
      .sort((a, b) => {
        const aPinnedIndex = pinnedIds.indexOf(a.id)
        const bPinnedIndex = pinnedIds.indexOf(b.id)
        const aPinned = aPinnedIndex !== -1
        const bPinned = bPinnedIndex !== -1
        const subjectCompare = (a.subject || 'General').localeCompare(b.subject || 'General')

        if (aPinned && bPinned) return aPinnedIndex - bPinnedIndex
        if (aPinned) return -1
        if (bPinned) return 1
        if (subjectCompare !== 0) return subjectCompare
        return 0
      })
  }, [filterMode, pinnedIds, savedQA, searchTerm, subjectFilter])

  const sidebarSubjects = Array.from(new Set(filteredQA.map((qa) => qa.subject || 'General')))
  const selectedQA = filteredQA.find((qa) => qa.id === selectedQuestionId) ?? null
  const pinnedQA = savedQA.filter((qa) => pinnedIds.includes(qa.id))
  const exportItems = filteredQA.length > 0 ? filteredQA : savedQA
  const draftLabel = aiResponse ? 'Answer ready' : loading ? 'Working' : 'Empty'
  const reviewedFlashcards = flashcards.filter((card) => card.reviewCount > 0).length
  const subjectsWithMaterial = allSubjects.filter((sub) => {
    const hasNotes = savedQA.some((qa) => (qa.subject || 'General') === sub)
    const hasCards = flashcards.some((card) => (card.subject || 'General') === sub)
    const hasPlans = examPlans.some((plan) => (plan.subject || 'General') === sub)
    return hasNotes || hasCards || hasPlans
  }).length
  const completedExams = examPlans.filter((plan) => plan.examDate < todayIso).length
  const progressStats: ProgressStats = {
    totalNotes: savedQA.length,
    totalSubjects: allSubjects.length,
    totalFlashcards: flashcards.length,
    reviewedFlashcards,
    pinnedNotes: pinnedQA.length,
    upcomingExams: examPlans.filter((plan) => plan.examDate >= todayIso).length,
    completedExams,
    revisionProgress: flashcards.length === 0 ? 0 : Math.round((reviewedFlashcards / flashcards.length) * 100),
    subjectCoverage: allSubjects.length === 0 ? 0 : Math.round((subjectsWithMaterial / allSubjects.length) * 100),
    examReadiness: examPlans.length === 0 ? 0 : Math.round((completedExams / examPlans.length) * 100),
  }
  const workspaceStats = [
    ['Study notes', `${progressStats.totalNotes}`],
    ['Reviewed', `${progressStats.reviewedFlashcards}/${progressStats.totalFlashcards}`],
    ['Upcoming exams', `${progressStats.upcomingExams}`],
    ['Pinned notes', `${progressStats.pinnedNotes}`],
  ]
  const reviewedDateSet = new Set(
    flashcards
      .map((card) => getIsoDate(card.reviewedAt))
      .filter((date): date is string => Boolean(date))
  )
  let studyStreak = 0
  let dayCursor = toDayNumber(todayIso)
  while (reviewedDateSet.has(new Date(dayCursor * 86400000).toISOString().slice(0, 10))) {
    studyStreak += 1
    dayCursor -= 1
  }
  const reviewedToday = flashcards.filter((card) => getIsoDate(card.reviewedAt) === todayIso).length
  const weakestSubjects = allSubjects
    .map((name) => {
      const subjectCards = flashcards.filter((card) => (card.subject || 'General') === name)
      const unreviewed = subjectCards.filter((card) => card.reviewCount === 0).length
      const averageReviews =
        subjectCards.length === 0
          ? 0
          : subjectCards.reduce((sum, card) => sum + card.reviewCount, 0) / subjectCards.length

      return {
        subject: name,
        score: unreviewed * 2 + Math.max(0, 3 - averageReviews),
        detail:
          subjectCards.length === 0
            ? 'No flashcards created yet.'
            : `${unreviewed}/${subjectCards.length} cards unreviewed, ${averageReviews.toFixed(1)} avg reviews.`,
      }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.subject.localeCompare(b.subject))
    .slice(0, 3)
  const todayDay = toDayNumber(todayIso)
  const upcomingDeadlines = examPlans.filter((plan) => {
    const examDay = toDayNumber(plan.examDate)
    return examDay >= todayDay && examDay <= todayDay + 14
  }).length
  const dashboardAnalytics: DashboardAnalytics = {
    studyStreak,
    reviewedToday,
    weakestSubjects: weakestSubjects.map(({ subject, detail }) => ({ subject, detail })),
    upcomingDeadlines,
  }
  const hasOnboardingWork = allSubjects.length === 0 || savedQA.length === 0 || flashcards.length === 0

  const subjectCards: SubjectCard[] = useMemo(
    () =>
      allSubjects.map((name) => {
        const matchingPlans = examPlans.filter((plan) => (plan.subject || 'General') === name)
        const upcomingPlan = matchingPlans
          .filter((plan) => plan.examDate >= todayIso)
          .sort((a, b) => a.examDate.localeCompare(b.examDate))[0]

        return {
          name,
          noteCount: savedQA.filter((qa) => (qa.subject || 'General') === name).length,
          examPlanCount: matchingPlans.length,
          pinnedCount: savedQA.filter((qa) => (qa.subject || 'General') === name && pinnedIds.includes(qa.id)).length,
          nextExamDate: upcomingPlan?.examDate,
          managedId: subjects.find((item) => item.name === name)?.id,
        }
      }),
    [allSubjects, examPlans, pinnedIds, savedQA, subjects, todayIso]
  )
  const globalSearchResults = useMemo<GlobalSearchResult[]>(() => {
    const query = globalSearchTerm.toLowerCase().trim()
    if (!query) return []

    const matches = (parts: Array<string | undefined | null>) =>
      parts.some((part) => (part ?? '').toLowerCase().includes(query))

    const noteResults: GlobalSearchResult[] = savedQA
      .filter((qa) => matches([qa.question, qa.subject, 'note', 'notes', 'study notes']))
      .map((qa) => ({
        id: qa.id,
        type: 'note',
        title: qa.question,
        description: qa.answer,
        subject: qa.subject || 'General',
      }))

    const flashcardResults: GlobalSearchResult[] = flashcards
      .filter((card) => matches([card.front, card.subject, 'flashcard', 'flashcards', 'card', 'cards']))
      .map((card) => ({
        id: card.id,
        type: 'flashcard',
        title: card.front,
        description: card.back,
        subject: card.subject || 'General',
      }))

    const subjectResults: GlobalSearchResult[] = subjectCards
      .filter((subject) => matches([subject.name, 'subject', 'subjects']))
      .map((subject) => ({
        id: subject.name,
        type: 'subject',
        title: subject.name,
        description: `${subject.noteCount} notes, ${subject.examPlanCount} exam plans, ${subject.pinnedCount} pinned.`,
        subject: subject.name,
      }))

    const examResults: GlobalSearchResult[] = examPlans
      .filter((plan) => matches([plan.subject, plan.goal, plan.examDate, 'exam', 'exams', 'exam plan', 'exam plans']))
      .map((plan) => ({
        id: plan.id,
        type: 'exam',
        title: `${plan.subject} exam on ${plan.examDate}`,
        description: plan.goal || plan.plan,
        subject: plan.subject || 'General',
      }))

    const typePriority = (result: GlobalSearchResult) => {
      if (['flashcard', 'flashcards', 'card', 'cards'].includes(query) && result.type === 'flashcard') return 0
      if (['note', 'notes', 'study notes'].includes(query) && result.type === 'note') return 0
      if (['subject', 'subjects'].includes(query) && result.type === 'subject') return 0
      if (['exam', 'exams', 'exam plan', 'exam plans'].includes(query) && result.type === 'exam') return 0
      return 1
    }

    return [...noteResults, ...flashcardResults, ...subjectResults, ...examResults]
      .sort((a, b) => typePriority(a) - typePriority(b))
      .slice(0, 12)
  }, [examPlans, flashcards, globalSearchTerm, savedQA, subjectCards])

  const handleOpenGlobalSearchResult = (result: GlobalSearchResult) => {
    const scrollTo = (selector: string) => {
      window.setTimeout(() => {
        document.querySelector(selector)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }, 50)
    }

    if (result.type === 'note') {
      setActiveSection('study-notes')
      setSubjectFilter(result.subject ?? 'All')
      setFilterMode('all')
      setSelectedQuestionId(result.id)
      setSearchTerm('')
      scrollTo(`[data-note-id="${result.id}"]`)
      return
    }

    if (result.type === 'flashcard') {
      setActiveSection('flashcards')
      setFocusedFlashcardId(result.id)
      scrollTo(`[data-flashcard-id="${result.id}"]`)
      return
    }

    if (result.type === 'subject') {
      setActiveSection('subjects')
      setSubjectFilter(result.title)
      setFilterMode('all')
      scrollTo(`[data-subject-id="${encodeURIComponent(result.title)}"]`)
      return
    }

    setActiveSection('exam-planner')
    setFocusedExamPlanId(result.id)
    scrollTo(`[data-exam-plan-id="${result.id}"]`)
  }
  const syncSubject = useCallback(async (name: string) => {
    const normalizedName = name.trim()
    if (!user || !normalizedName) return
    if (subjects.some((item) => item.name.toLowerCase() === normalizedName.toLowerCase())) return

    const { data, error } = await createSubject({
      userId: user.id,
      name: normalizedName,
    })

    if (isMissingSubjectsTable(error)) return

    if (data) {
      setSubjects((prev) =>
        prev.some((item) => item.id === data.id || item.name.toLowerCase() === data.name.toLowerCase())
          ? prev
          : [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
      )
    }
  }, [subjects, user])

  useEffect(() => {
    if (!user || fetchingSaved) return

    const missingSubjects = allSubjects.filter(
      (name) => !subjects.some((item) => item.name.toLowerCase() === name.toLowerCase())
    )

    if (missingSubjects.length === 0) return

    missingSubjects.forEach((name) => {
      syncSubject(name)
    })
  }, [allSubjects, fetchingSaved, subjects, syncSubject, user])

  const handleCreateSubject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) return

    const normalizedName = subjectName.trim()
    if (!normalizedName) return

    if (subjects.some((item) => item.name.toLowerCase() === normalizedName.toLowerCase())) {
      setSubjectName('')
      setStatus({ type: 'success', text: `${normalizedName} is already available as a subject.` })
      return
    }

    setCreatingSubject(true)
    setStatus(null)

    try {
      const { data, error } = await createSubject({
        userId: user.id,
        name: normalizedName,
      })
      if (isMissingSubjectsTable(error)) {
        setSubjectName('')
        setStatus({
          type: 'error',
          text: 'Subjects table is not set up in Supabase yet. Run the updated docs/supabase-schema.sql file, then refresh the app.',
        })
        return
      }
      if (error || !data) throw new Error(error?.message || 'Subject could not be created.')

      setSubjects((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      setSubjectName('')
      setStatus({ type: 'success', text: 'Subject added to your workspace.' })
    } catch (err) {
      setStatus({ type: 'error', text: err instanceof Error ? err.message : 'Unexpected error' })
    } finally {
      setCreatingSubject(false)
    }
  }

  const handleDeleteManagedSubject = async (id: string) => {
    const previous = subjects
    const removedSubject = subjects.find((item) => item.id === id)
    setSubjects((prev) => prev.filter((item) => item.id !== id))

    const { error } = await deleteSubject(id)
    if (error) {
      setSubjects(previous)
      setStatus({ type: 'error', text: error.message })
      return
    }

    if (removedSubject && subjectFilter === removedSubject.name) setSubjectFilter('All')
    setStatus({ type: 'success', text: 'Subject deleted. Existing notes keep their subject label.' })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus(null)

    if (input.trim().length < 10) {
      setStatus({ type: 'error', text: 'Please enter a more detailed question with at least 10 characters.' })
      return
    }

    setLoading(true)
    setAiResponse('')

    try {
      setAiResponse(await askAi(input))
      setTempDelete(true)
    } catch (err) {
      setStatus({ type: 'error', text: err instanceof Error ? err.message : 'Unexpected error' })
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerate = async () => {
    if (!input.trim() || loading) return
    setLoading(true)
    setStatus(null)

    try {
      setAiResponse(await askAi(`Improve this into a clearer student-friendly answer:\n\n${input}`))
      setTempDelete(true)
      setStatus({ type: 'success', text: 'Answer regenerated.' })
    } catch (err) {
      setStatus({ type: 'error', text: err instanceof Error ? err.message : 'Unexpected error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveQA = async () => {
    if (!input.trim() || !aiResponse || !user || loading) return

    setLoading(true)
    setStatus(null)

    try {
      const normalizedSubject = subject.trim() || 'General'
      await syncSubject(normalizedSubject)
      const { data, error } = await saveQuestion({
        userId: user.id,
        question: input.trim(),
        answer: aiResponse,
        subject: normalizedSubject,
      })

      if (error) throw new Error(error.message)
      if (data?.[0]) setSavedQA((prev) => [data[0] as QA, ...prev])

      clearDraft(setInput, setSubject, setAiResponse, setTempDelete)
      setStatus({ type: 'success', text: 'Saved to your study notes.' })
    } catch (err) {
      setStatus({ type: 'error', text: `Save failed: ${err instanceof Error ? err.message : 'Unexpected error'}` })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateExamPlan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) return
    setStatus(null)

    if (!examSubject.trim() || !examDate) {
      setStatus({ type: 'error', text: 'Add an exam subject and exam date first.' })
      return
    }

    setPlanningExam(true)

    try {
      const today = new Date(`${todayIso}T00:00:00`)
      const selectedExamDate = new Date(`${examDate}T00:00:00`)
      const daysUntilExam = Math.max(
        Math.ceil((selectedExamDate.getTime() - today.getTime()) / 86400000),
        0
      )
      const planDays = Math.max(daysUntilExam, 1)
      const plan = await askAi(
        `Create a practical exam preparation plan for a student.
Subject: ${examSubject.trim()}
Exam date: ${examDate}
Today: ${todayIso}
Days available before the exam: ${daysUntilExam}
Goal: ${examGoal.trim() || 'Understand the subject and revise confidently'}

Create exactly ${planDays} day sections, no more than ${planDays}.
Use this exact format:
Day 1:
- Task: one concrete study action for that day
- Task: one concrete practice or review action for that day

Rules:
- Do not create tasks after the exam date.
- If the exam is today, create only one light review day.
- Each task must be something the student can do, not a heading or explanation.
- Keep tasks short and realistic.
- Do not include overview paragraphs, markdown tables, or extra commentary.`
      )

      await syncSubject(examSubject.trim())
      setDraftExamPlan({
        subject: examSubject.trim(),
        examDate,
        goal: examGoal.trim(),
        plan,
      })
      setStatus({ type: 'success', text: 'Exam plan generated. Save it when it looks right.' })
    } catch (err) {
      setStatus({ type: 'error', text: err instanceof Error ? err.message : 'Unexpected error' })
    } finally {
      setPlanningExam(false)
    }
  }

  const handleDeleteExamPlan = async (id: string) => {
    const previous = examPlans
    setExamPlans((prev) => prev.filter((plan) => plan.id !== id))

    const { error } = await deleteExamPlan(id)
    if (error) {
      setExamPlans(previous)
      setStatus({ type: 'error', text: error.message })
      return
    }

    setStatus({ type: 'success', text: 'Exam plan deleted.' })
  }

  const handleSaveExamPlan = async () => {
    if (!user || !draftExamPlan) return
    setStatus(null)
    setSavingExamPlan(true)

    try {
      await syncSubject(draftExamPlan.subject)
      const { data, error } = await createExamPlan({
        userId: user.id,
        subject: draftExamPlan.subject,
        examDate: draftExamPlan.examDate,
        goal: draftExamPlan.goal,
        plan: draftExamPlan.plan,
      })

      if (error || !data) throw new Error(error?.message || 'Exam plan could not be saved.')

      setExamPlans((prev) => [data, ...prev])
      setDraftExamPlan(null)
      setExamSubject('')
      setExamDate('')
      setExamGoal('')
      setStatus({ type: 'success', text: 'Exam plan saved.' })
    } catch (err) {
      setStatus({ type: 'error', text: err instanceof Error ? err.message : 'Unexpected error' })
    } finally {
      setSavingExamPlan(false)
    }
  }

  const handleCreateSummary = async (qa: QA) => {
    if (!user || summarizingId) return
    setSummarizingId(qa.id)
    setStatus(null)

    try {
      const summary = await askAi(
        `Create a short revision summary that is clearly shorter than the saved answer.
Use 3-5 brief bullet points, keep only the most important facts, and do not repeat full paragraphs from the answer.
If the answer is already short, make the summary 1-2 bullets only.

Question: ${qa.question}

Answer: ${qa.answer}`
      )
      const { error } = await upsertRevisionSummary({
        userId: user.id,
        questionId: qa.id,
        summary,
      })
      if (error) throw new Error(error.message)

      setSummaries((prev) => ({ ...prev, [qa.id]: summary }))
      setSelectedQuestionId(qa.id)
      setStatus({ type: 'success', text: 'Revision summary created.' })
    } catch (err) {
      setStatus({ type: 'error', text: err instanceof Error ? err.message : 'Unexpected error' })
    } finally {
      setSummarizingId(null)
    }
  }

  const handleGenerateFlashcards = async (qa: QA) => {
    if (!user || generatingFlashcardsId) return

    setGeneratingFlashcardsId(qa.id)
    setStatus(null)

    try {
      const existingCardsForNote = flashcards.filter((card) => card.questionId === qa.id)
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Your session expired. Please log in again.')
      }

      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          question: qa.question,
          answer: qa.answer,
          subject: qa.subject || 'General',
          existingQuestions: existingCardsForNote.map((card) => card.front),
        }),
      })

      const payload = await res.json()

      if (!res.ok) {
        throw new Error(payload.error || 'Flashcards could not be generated.')
      }

      const existingFronts = new Set(
        existingCardsForNote.map((card) => normalizeFlashcardFront(card.front))
      )
      const newFronts = new Set<string>()
      const usableCards =
        Array.isArray(payload.cards)
          ? payload.cards
              .map((card: { front?: unknown; back?: unknown }) => ({
                front: String(card.front ?? '').trim(),
                back: String(card.back ?? '').trim(),
              }))
              .filter((card: { front: string; back: string }) => card.front && card.back)
              .filter((card: { front: string; back: string }) => {
                const normalizedFront = normalizeFlashcardFront(card.front)
                if (existingFronts.has(normalizedFront) || newFronts.has(normalizedFront)) return false
                newFronts.add(normalizedFront)
                return true
              })
          : []

      if (usableCards.length === 0) {
        setStatus({ type: 'success', text: 'No new flashcards added. This note already has those questions.' })
        return
      }

      setDraftFlashcards({
        questionId: qa.id,
        subject: qa.subject || 'General',
        cards: usableCards,
      })
      setSelectedQuestionId(qa.id)
      setStatus({ type: 'success', text: `${usableCards.length} flashcards ready to review.` })
    } catch (err) {
      setStatus({ type: 'error', text: err instanceof Error ? err.message : 'Unexpected error' })
    } finally {
      setGeneratingFlashcardsId(null)
    }
  }

  const handleSaveDraftFlashcards = async () => {
    if (!user || !draftFlashcards || savingFlashcardsId) return

    setSavingFlashcardsId(draftFlashcards.questionId)
    setStatus(null)

    try {
      const { data, error } = await createFlashcards({
        userId: user.id,
        questionId: draftFlashcards.questionId,
        subject: draftFlashcards.subject,
        cards: draftFlashcards.cards,
      })

      if (isMissingFlashcardsTable(error)) {
        setStatus({
          type: 'error',
          text: 'Flashcards table is not set up in Supabase yet. Run the updated docs/supabase-schema.sql file, then refresh the app.',
        })
        return
      }
      if (error) throw new Error(error.message)

      setFlashcards((prev) => [...data, ...prev])
      setDraftFlashcards(null)
      setStatus({ type: 'success', text: `${data.length} flashcards saved.` })
    } catch (err) {
      setStatus({ type: 'error', text: err instanceof Error ? err.message : 'Unexpected error' })
    } finally {
      setSavingFlashcardsId(null)
    }
  }

  const handleGenerateQuiz = async (params: { material: string; subject: string; title: string; sourceType: 'note' | 'subject' | 'material' }): Promise<GeneratedQuiz | null> => {
    if (!user || generatingQuiz) return null

    setGeneratingQuiz(true)
    setStatus(null)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) throw new Error('Your session expired. Please log in again.')

      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ material: params.material, subject: params.subject }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Quiz could not be generated.')

      const questions: QuizQuestion[] = Array.isArray(payload.questions)
        ? payload.questions
            .map((item: QuizQuestion) => ({
              id: String(item.id ?? '').trim(),
              type: item.type,
              question: String(item.question ?? '').trim(),
              options: Array.isArray(item.options) ? item.options.map((option) => String(option).trim()).filter(Boolean) : undefined,
              answer: String(item.answer ?? '').trim(),
              explanation: String(item.explanation ?? '').trim(),
              topic: String(item.topic ?? 'General').trim() || 'General',
            }))
            .filter((item: QuizQuestion) => item.id && item.question && item.answer && item.explanation)
        : []

      if (questions.length === 0) throw new Error('The quiz response was incomplete. Please try again.')

      const { data: quiz, error: quizError } = await createQuiz({
        userId: user.id,
        subject: params.subject,
        title: params.title,
        sourceType: params.sourceType,
        questions,
      })
      if (isQuizSchemaMissing(quizError)) {
        throw new Error('Quiz tables are not set up in Supabase. Run the updated docs/supabase-schema.sql file, then refresh the app.')
      }
      if (quizError || !quiz) throw new Error(quizError?.message || 'Quiz could not be saved.')

      setStatus({
        type: 'success',
        text: `${questions.length}-question quiz created from ${params.title}.${payload.fallback ? ' A basic quiz was used because AI output was unavailable.' : ''}`,
      })
      return { id: quiz.id, questions }
    } catch (error) {
      setStatus({ type: 'error', text: error instanceof Error ? error.message : 'Unexpected error' })
      return null
    } finally {
      setGeneratingQuiz(false)
    }
  }

  const handleSaveQuizAttempt = async (params: {
    quizId: string
    questions: QuizQuestion[]
    answers: Record<string, string>
    startedAt: number
  }) => {
    if (!user) return false

    const answers = params.questions.map((question) => {
      const selectedAnswer = params.answers[question.id]?.trim() || ''
      return {
        questionId: question.id,
        questionText: question.question,
        questionType: question.type,
        topic: question.topic || 'General',
        selectedAnswer,
        correctAnswer: question.answer,
        isCorrect: isQuizAnswerCorrect(question, selectedAnswer),
      }
    })
    const correctAnswers = answers.filter((answer) => answer.isCorrect).length
    const totalQuestions = answers.length
    const score = totalQuestions === 0 ? 0 : Math.round((correctAnswers / totalQuestions) * 100)
    const durationSeconds = Math.max(0, Math.round((Date.now() - params.startedAt) / 1000))

    const { data, error } = await saveQuizAttempt({
      userId: user.id,
      quizId: params.quizId,
      score,
      correctAnswers,
      totalQuestions,
      durationSeconds,
      answers,
    })
    if (isQuizSchemaMissing(error)) {
      setStatus({ type: 'error', text: 'Quiz tables are not set up in Supabase. Run the updated docs/supabase-schema.sql file, then refresh the app.' })
      return false
    }
    if (error || !data) {
      setStatus({ type: 'error', text: error?.message || 'Quiz result could not be saved.' })
      return false
    }

    setQuizHistory((prev) => [
      {
        id: data.id,
        subject: 'General',
        title: 'Quiz',
        score,
        correctAnswers,
        totalQuestions,
        durationSeconds,
        completedAt: data.completed_at,
      },
      ...prev,
    ])
    const analytics = await fetchQuizAnalytics(user.id)
    if (!analytics.error) {
      setQuizHistory(analytics.history)
      setWeakQuizTopics(analytics.topics)
    }
    setStatus({ type: 'success', text: `Quiz result saved: ${score}% in ${Math.max(1, Math.round(durationSeconds / 60))} minute(s).` })
    return true
  }

  const handleImportMaterial = async () => {
    if (!user || importingMaterial) return

    const materialForImport = [importMaterial, importFileMaterial].join('\n\n').trim()

    if (materialForImport.length < 80) {
      setStatus({ type: 'error', text: 'Add more material before importing.' })
      return
    }

    setImportingMaterial(true)
    setStatus(null)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Your session expired. Please log in again.')
      }

      const res = await fetch('/api/import-material', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          material: materialForImport,
          subject: importSubject.trim() || 'General',
        }),
      })
      const payload = await res.json()

      if (!res.ok) {
        throw new Error(payload.error || 'Material could not be imported.')
      }

      const flashcardsFromPayload = Array.isArray(payload.flashcards)
        ? payload.flashcards
            .map((card: { front?: unknown; back?: unknown }) => ({
              front: String(card.front ?? '').trim(),
              back: String(card.back ?? '').trim(),
            }))
            .filter((card: { front: string; back: string }) => card.front && card.back)
        : []

      if (!payload.note || flashcardsFromPayload.length === 0) {
        throw new Error('Import preview was incomplete.')
      }

      setImportPreview({
        title: String(payload.title ?? 'Imported study material').trim(),
        note: String(payload.note).trim(),
        flashcards: flashcardsFromPayload,
      })
      setStatus({ type: 'success', text: 'Import preview ready.' })
    } catch (err) {
      setStatus({ type: 'error', text: err instanceof Error ? err.message : 'Unexpected error' })
    } finally {
      setImportingMaterial(false)
    }
  }

  const handleSaveImport = async () => {
    if (!user || !importPreview || savingImport) return

    setSavingImport(true)
    setStatus(null)

    try {
      const normalizedSubject = importSubject.trim() || 'General'
      await syncSubject(normalizedSubject)
      const { data, error } = await saveQuestion({
        userId: user.id,
        question: importPreview.title,
        answer: importPreview.note,
        subject: normalizedSubject,
      })

      if (error) throw new Error(error.message)
      const savedNote = data?.[0] as QA | undefined
      if (!savedNote) throw new Error('Imported note could not be saved.')

      setSavedQA((prev) => [savedNote, ...prev])

      const cardsResult = await createFlashcards({
        userId: user.id,
        questionId: savedNote.id,
        subject: normalizedSubject,
        cards: importPreview.flashcards,
      })

      if (isMissingFlashcardsTable(cardsResult.error)) {
        setStatus({
          type: 'error',
          text: 'Imported note saved, but flashcards table is not set up in Supabase yet.',
        })
        setImportPreview(null)
        return
      }
      if (cardsResult.error) throw new Error(cardsResult.error.message)

      setFlashcards((prev) => [...cardsResult.data, ...prev])
      setImportMaterial('')
      setImportFileMaterial('')
      setImportSubject('')
      setImportPreview(null)
      setSelectedQuestionId(savedNote.id)
      setSubjectFilter(normalizedSubject)
      setActiveSection('study-notes')
      setStatus({ type: 'success', text: 'Imported note and flashcards saved.' })
    } catch (err) {
      setStatus({ type: 'error', text: err instanceof Error ? err.message : 'Unexpected error' })
    } finally {
      setSavingImport(false)
    }
  }

  const handleDeleteFlashcard = async (id: string) => {
    const previous = flashcards
    setDeletingFlashcardId(id)
    setFlashcards((prev) => prev.filter((card) => card.id !== id))

    const { error } = await deleteFlashcard(id)
    if (error) {
      setFlashcards(previous)
      setStatus({ type: 'error', text: error.message })
    } else {
      setStatus({ type: 'success', text: 'Flashcard deleted.' })
    }

    setDeletingFlashcardId(null)
  }

  const handleReviewFlashcard = async (card: Flashcard, rating: FlashcardRating) => {
    if (reviewingFlashcardId) return

    setReviewingFlashcardId(card.id)
    const { data, error } = await reviewFlashcard(card, rating)

    if (error || !data) {
      const details = error?.message?.toLowerCase() ?? ''
      setStatus({
        type: 'error',
        text: details.includes('next_review_at') || details.includes('interval_days') || details.includes('ease_factor')
          ? 'Spaced repetition columns are not set up in Supabase. Run the updated docs/supabase-schema.sql file, then refresh the app.'
          : error?.message || 'Flashcard review could not be saved.',
      })
    } else {
      setFlashcards((prev) => prev.map((item) => (item.id === data.id ? data : item)))
      setStatus({ type: 'success', text: `Flashcard scheduled again after: ${rating}.` })
    }

    setReviewingFlashcardId(null)
  }

  const togglePinned = async (id: string) => {
    if (!user) return
    const isPinned = pinnedIds.includes(id)
    setPinnedIds((prev) => (isPinned ? prev.filter((savedId) => savedId !== id) : [id, ...prev]))

    const { error } = isPinned ? await unpinQuestion(user.id, id) : await pinQuestion(user.id, id)
    if (error) {
      setPinnedIds((prev) => (isPinned ? [id, ...prev] : prev.filter((savedId) => savedId !== id)))
      setStatus({ type: 'error', text: error.message })
    }
  }

  const handleDeleteSaved = async (id: string) => {
    setStatus(null)

    try {
      const { error } = await deleteQuestion(id)
      if (error) throw new Error(error.message)

      setSavedQA((prev) => prev.filter((qa) => qa.id !== id))
      setPinnedIds((prev) => prev.filter((savedId) => savedId !== id))
      setSummaries((prev) => {
        const copy = { ...prev }
        delete copy[id]
        return copy
      })
      if (editingId === id) setEditingId(null)
      if (selectedQuestionId === id) setSelectedQuestionId(null)
      if (draftFlashcards?.questionId === id) setDraftFlashcards(null)
      setStatus({ type: 'success', text: 'Saved note deleted.' })
    } catch (err) {
      setStatus({ type: 'error', text: err instanceof Error ? err.message : 'Unexpected error' })
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return

    setConfirmingDelete(true)
    try {
      if (deleteTarget.type === 'note') await handleDeleteSaved(deleteTarget.id)
      if (deleteTarget.type === 'subject') await handleDeleteManagedSubject(deleteTarget.id)
      if (deleteTarget.type === 'flashcard') await handleDeleteFlashcard(deleteTarget.id)
      if (deleteTarget.type === 'exam-plan') await handleDeleteExamPlan(deleteTarget.id)
      if (deleteTarget.type === 'account') await handleDeleteAccount()
      setDeleteTarget(null)
    } finally {
      setConfirmingDelete(false)
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editQuestion.trim()) {
      setStatus({ type: 'error', text: 'Question cannot be empty.' })
      return
    }

    try {
      const normalizedSubject = editSubject.trim() || 'General'
      await syncSubject(normalizedSubject)
      const { error } = await updateQuestion({
        id,
        question: editQuestion.trim(),
        subject: normalizedSubject,
      })

      if (error) throw new Error(error.message)

      setSavedQA((prev) =>
        prev.map((qa) =>
          qa.id === id ? { ...qa, question: editQuestion.trim(), subject: normalizedSubject } : qa
        )
      )
      setEditingId(null)
      setStatus({ type: 'success', text: 'Saved note updated.' })
    } catch (err) {
      setStatus({ type: 'error', text: err instanceof Error ? err.message : 'Unexpected error' })
    }
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      setStatus({ type: 'error', text: error.message })
      return
    }
    router.push('/login')
  }

  const handleDeleteAccount = async () => {
    if (!user || deletingAccount) return

    setDeletingAccount(true)
    setStatus(null)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Your session expired. Please log in again.')
      }

      const res = await fetch('/api/account', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })
      const payload = await res.json()

      if (!res.ok) {
        throw new Error(payload.error || 'Account could not be deleted.')
      }

      await supabase.auth.signOut()
      router.push('/signup')
    } catch (err) {
      setStatus({ type: 'error', text: err instanceof Error ? err.message : 'Unexpected error' })
    } finally {
      setDeletingAccount(false)
    }
  }

  const handleSaveProfile = async () => {
    if (savingProfile) return

    setSavingProfile(true)
    setStatus(null)

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: displayName.trim(),
          study_level: studyLevel,
          study_preference: studyPreference,
        },
      })

      if (error) throw new Error(error.message)

      setStatus({ type: 'success', text: 'Profile preferences saved.' })
    } catch (err) {
      setStatus({ type: 'error', text: err instanceof Error ? err.message : 'Unexpected error' })
    } finally {
      setSavingProfile(false)
    }
  }

  const exportNotes = (items: QA[]) => {
    if (items.length === 0) {
      setStatus({ type: 'error', text: 'There are no notes to export.' })
      return
    }

    const content = items
      .map((qa, index) => {
        const summary = summaries[qa.id] ? `\nRevision summary:\n${summaries[qa.id]}\n` : ''
        return `${index + 1}. ${qa.subject || 'General'}\nQuestion: ${qa.question}\n\nAnswer:\n${qa.answer}${summary}`
      })
      .join('\n\n---\n\n')

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'studyai-study-notes.txt'
    link.click()
    URL.revokeObjectURL(url)
    setStatus({ type: 'success', text: 'Study notes exported.' })
  }

  const printNotes = (items: QA[]) => {
    if (items.length === 0) {
      setStatus({ type: 'error', text: 'There are no notes to print.' })
      return
    }

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      setStatus({ type: 'error', text: 'Allow popups to print or save as PDF.' })
      return
    }

    const escapeHtml = (value: string) =>
      value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

    printWindow.document.write(`
      <html>
        <head>
          <title>StudyAI Study Notes</title>
          <style>
            body { font-family: Arial, sans-serif; color: #1f2937; padding: 32px; line-height: 1.6; }
            h1 { color: #115e59; }
            article { border-bottom: 1px solid #e7e5e4; padding: 20px 0; }
            .subject { color: #0f766e; font-weight: 700; text-transform: uppercase; font-size: 12px; letter-spacing: .12em; }
            pre { white-space: pre-wrap; font-family: inherit; }
          </style>
        </head>
        <body>
          <h1>StudyAI Study Notes</h1>
          ${items
            .map(
              (qa) => `
                <article>
                  <p class="subject">${escapeHtml(qa.subject || 'General')}</p>
                  <h2>${escapeHtml(qa.question)}</h2>
                  <pre>${escapeHtml(qa.answer)}</pre>
                  ${
                    summaries[qa.id]
                      ? `<h3>Revision summary</h3><pre>${escapeHtml(summaries[qa.id])}</pre>`
                      : ''
                  }
                </article>
              `
            )
            .join('')}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  if (authLoading || !user) return null

  return (
    <Protected>
      <div className="page-shell min-h-screen bg-stone-50 text-slate-900 transition-colors duration-300">
        <Toast status={status} onClose={() => setStatus(null)} />
        <ConfirmModal
          open={Boolean(deleteTarget)}
          title={deleteTarget?.title ?? ''}
          description={deleteTarget?.description ?? ''}
          loading={confirmingDelete}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
        <div className="flex min-h-screen w-full flex-col px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-1 flex-col gap-6 xl:block xl:pl-76">
            <DashboardSidebar
              email={user.email ?? undefined}
              profileLabel={displayName}
              stats={workspaceStats}
              activeSection={activeSection}
              onSectionChange={setActiveSection}
              onLogout={handleLogout}
            />

            <main className="min-w-0 space-y-6 pb-24 xl:pb-0">
              <GlobalSearch
                query={globalSearchTerm}
                results={globalSearchResults}
                onQueryChange={setGlobalSearchTerm}
                onOpenResult={handleOpenGlobalSearchResult}
              />

              <DashboardOverview
                examPlans={examPlans}
                todayIso={todayIso}
                progress={progressStats}
                analytics={dashboardAnalytics}
              />

              {hasOnboardingWork && (
                <OnboardingPanel
                  hasSubject={allSubjects.length > 0}
                  hasNote={savedQA.length > 0}
                  hasFlashcards={flashcards.length > 0}
                  onCreateSubject={() => setActiveSection('subjects')}
                  onCreateNote={() => {
                    setActiveSection('study-notes')
                    if (!input.trim()) {
                      setSubject(promptSuggestions[0].subject)
                      setInput(promptSuggestions[0].question)
                    }
                  }}
                  onCreateFlashcards={() => {
                    setActiveSection('study-notes')
                    if (savedQA[0]) {
                      setSelectedQuestionId(savedQA[0].id)
                    } else {
                      setSubject(promptSuggestions[0].subject)
                      setInput(promptSuggestions[0].question)
                    }
                  }}
                />
              )}

              {!activeSection && (
                <section className="surface-panel rounded-3xl border border-stone-200/80 bg-white/96 p-5 text-center sm:p-6">
                  <p className="text-sm font-semibold text-slate-800">Choose a workspace section</p>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    Open Subjects, Exam planner, Study notes library, Flashcards, Quiz, or Import from the navigation.
                  </p>
                </section>
              )}

              {activeSection === 'subjects' && (
              <div id="subjects" className="scroll-mt-24">
                <SubjectManager
                  subjects={subjectCards}
                  subjectName={subjectName}
                  creating={creatingSubject}
                  syncing={fetchingSaved}
                  activeFilter={subjectFilter}
                  notes={savedQA}
                  flashcards={flashcards}
                  pinnedIds={pinnedIds}
                  onSubjectNameChange={setSubjectName}
                  onCreateSubject={handleCreateSubject}
                  onFilterSubject={(value) => {
                    setSubjectFilter((current) => (current === value ? 'All' : value))
                    setFilterMode('all')
                  }}
                  onDeleteManagedSubject={(id) => {
                    const subjectToDelete = subjects.find((item) => item.id === id)
                    setDeleteTarget({
                      type: 'subject',
                      id,
                      title: 'Delete subject?',
                      description: `This removes ${subjectToDelete?.name ?? 'this subject'} from your managed subjects. Existing notes and flashcards keep their subject label.`,
                    })
                  }}
                />
              </div>
              )}

              {activeSection === 'exam-planner' && (
              <div id="exam-planner" className="scroll-mt-24">
                <ExamPlanner
                  plans={examPlans}
                  draftPlan={draftExamPlan}
                  subject={examSubject}
                  examDate={examDate}
                  goal={examGoal}
                  generating={planningExam}
                  saving={savingExamPlan}
                  focusedPlanId={focusedExamPlanId}
                  subjectOptions={allSubjects}
                  todayIso={todayIso}
                  onSubjectChange={setExamSubject}
                  onExamDateChange={setExamDate}
                  onGoalChange={setExamGoal}
                  onCreatePlan={handleCreateExamPlan}
                  onUseSamplePlan={() => {
                    setExamSubject(allSubjects[0] ?? 'Biology')
                    setExamDate(todayIso)
                    setExamGoal('Review key concepts and practice exam questions')
                  }}
                  onSaveDraft={handleSaveExamPlan}
                  onDiscardDraft={() => setDraftExamPlan(null)}
                  onOpenImport={() => setActiveSection('import-material')}
                  onDeletePlan={(id) => {
                    setDeleteTarget({
                      type: 'exam-plan',
                      id,
                      title: 'Delete exam plan?',
                      description: 'This removes the saved exam plan from your workspace. This cannot be undone.',
                    })
                  }}
                />
              </div>
              )}

              {activeSection === 'study-notes' && (
              <>
                <AskAiPanel
                  input={input}
                  subject={subject}
                  aiResponse={aiResponse}
                  loading={loading}
                  tempDelete={tempDelete}
                  status={null}
                  draftLabel={draftLabel}
                  promptSuggestions={promptSuggestions}
                  subjectOptions={allSubjects}
                  onInputChange={setInput}
                  onSubjectChange={setSubject}
                  onSubmit={handleSubmit}
                  onStatusClear={() => setStatus(null)}
                  onRegenerate={handleRegenerate}
                  onSave={handleSaveQA}
                  onDiscard={() => {
                    setStatus(null)
                    clearDraft(setInput, setSubject, setAiResponse, setTempDelete)
                  }}
                />

                <div id="study-notes" className="scroll-mt-24">
                  <SavedLibrary
                    savedQA={savedQA}
                    filteredQA={filteredQA}
                    sidebarSubjects={sidebarSubjects}
                    allSubjects={allSubjects}
                    fetchingSaved={fetchingSaved}
                    searchTerm={searchTerm}
                    subjectFilter={subjectFilter}
                    filterMode={filterMode}
                    pinnedIds={pinnedIds}
                    selectedQA={selectedQA}
                    summaries={summaries}
                    editingId={editingId}
                    editQuestion={editQuestion}
                    editSubject={editSubject}
                    summarizingId={summarizingId}
                    generatingFlashcardsId={generatingFlashcardsId}
                    savingFlashcardsId={savingFlashcardsId}
                    draftFlashcards={draftFlashcards}
                    flashcardCounts={flashcards.reduce<Record<string, number>>((acc, card) => {
                      if (card.questionId) acc[card.questionId] = (acc[card.questionId] ?? 0) + 1
                      return acc
                    }, {})}
                    promptSuggestions={promptSuggestions}
                    subjectOptions={allSubjects}
                    onSearchChange={setSearchTerm}
                    onSubjectFilterChange={setSubjectFilter}
                    onFilterModeToggle={() => setFilterMode((mode) => (mode === 'pinned' ? 'all' : 'pinned'))}
                    onExport={() => exportNotes(exportItems)}
                    onPrint={() => printNotes(exportItems)}
                    onPromptPick={(prompt) => {
                      setSubject(prompt.subject)
                      setInput(prompt.question)
                    }}
                    onClearFilters={() => {
                      setSearchTerm('')
                      setSubjectFilter('All')
                      setFilterMode('all')
                    }}
                    onSelectQuestion={(id) => {
                      setSelectedQuestionId((currentId) => (currentId === id ? null : id))
                      if (editingId !== id) setEditingId(null)
                    }}
                    onTogglePinned={togglePinned}
                    onEditQuestionChange={setEditQuestion}
                    onEditSubjectChange={setEditSubject}
                    onSaveEdit={handleUpdate}
                    onCancelEdit={() => setEditingId(null)}
                    onStartEdit={(qa) => {
                      setEditingId(qa.id)
                      setEditQuestion(qa.question)
                      setEditSubject(qa.subject || '')
                    }}
                    onSummary={handleCreateSummary}
                    onFlashcards={handleGenerateFlashcards}
                    onSaveDraftFlashcards={handleSaveDraftFlashcards}
                    onDiscardDraftFlashcards={() => setDraftFlashcards(null)}
                    onDeleteRequest={(qa) => {
                      setDeleteTarget({
                        type: 'note',
                        id: qa.id,
                        title: 'Delete saved note?',
                        description: 'This removes the note, its pin, and related revision material from your study history. This cannot be undone.',
                      })
                    }}
                  />
                </div>
              </>
              )}

              {activeSection === 'flashcards' && (
              <div id="flashcards" className="scroll-mt-24">
                <FlashcardsPanel
                  flashcards={flashcards}
                  syncing={fetchingSaved}
                  deletingId={deletingFlashcardId}
                  focusedFlashcardId={focusedFlashcardId}
                  reviewingId={reviewingFlashcardId}
                  onOpenNotes={() => setActiveSection('study-notes')}
                  onRate={handleReviewFlashcard}
                  onDelete={(id) => {
                    setDeleteTarget({
                      type: 'flashcard',
                      id,
                      title: 'Delete flashcard?',
                      description: 'This removes the flashcard from your review deck. This cannot be undone.',
                    })
                  }}
                />
              </div>
              )}

              {activeSection === 'quiz' && (
              <div id="quiz" className="scroll-mt-24">
                <QuizPanel
                  notes={savedQA}
                  subjects={allSubjects}
                  generating={generatingQuiz}
                  history={quizHistory}
                  weakTopics={weakQuizTopics}
                  onGenerate={handleGenerateQuiz}
                  onSubmitQuiz={handleSaveQuizAttempt}
                />
              </div>
              )}

              {activeSection === 'import-material' && (
              <div id="import-material" className="scroll-mt-24">
                <ImportMaterial
                  material={importMaterial}
                  fileMaterial={importFileMaterial}
                  subject={importSubject}
                  preview={importPreview}
                  importing={importingMaterial}
                  saving={savingImport}
                  subjectOptions={allSubjects}
                  onMaterialChange={setImportMaterial}
                  onFileMaterialChange={setImportFileMaterial}
                  onSubjectChange={setImportSubject}
                  onImport={handleImportMaterial}
                  onSave={handleSaveImport}
                  onDiscard={() => setImportPreview(null)}
                />
              </div>
              )}

              {activeSection === 'profile' && (
              <div id="profile" className="scroll-mt-24">
                <ProfileSettings
                  email={user.email ?? undefined}
                  createdAt={user.created_at}
                  displayName={displayName}
                  studyLevel={studyLevel}
                  studyPreference={studyPreference}
                  savingProfile={savingProfile}
                  deletingAccount={deletingAccount}
                  onDisplayNameChange={setDisplayName}
                  onStudyLevelChange={setStudyLevel}
                  onStudyPreferenceChange={setStudyPreference}
                  onSaveProfile={handleSaveProfile}
                  onLogout={handleLogout}
                  onDeleteAccount={() => {
                    setDeleteTarget({
                      type: 'account',
                      id: user.id,
                      title: 'Delete your account?',
                      description: 'This permanently deletes your account and all workspace data. This cannot be undone.',
                    })
                  }}
                />
              </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </Protected>
  )
}
