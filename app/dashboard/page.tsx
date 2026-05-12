'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Protected from '../components/Protected'
import { useAuth } from '../context/AuthContext'
import {
  deleteQuestion,
  fetchQuestions,
  QA,
  saveQuestion,
  updateQuestion,
} from '../lib/questions'
import { supabase } from '../lib/supabase'

type StatusMessage = {
  type: 'success' | 'error'
  text: string
}

type FilterMode = 'all' | 'pinned'

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
  const [deleteModalOpenId, setDeleteModalOpenId] = useState<string | null>(null)
  const [tempDelete, setTempDelete] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('All')
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [pinnedIds, setPinnedIds] = useState<string[]>([])
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const [summaries, setSummaries] = useState<Record<string, string>>({})
  const [summarizingId, setSummarizingId] = useState<string | null>(null)
  const darkMode = false

  const pinnedStorageKey = user ? `studyai-pinned-${user.id}` : ''

  useEffect(() => {
    if (!user) {
      setSavedQA([])
      setFetchingSaved(false)
      return
    }

    const loadQuestions = async () => {
      setFetchingSaved(true)
      const { data, error } = await fetchQuestions(user.id)

      if (error) {
        setStatus({
          type: 'error',
          text: 'We could not load your saved questions right now.',
        })
      } else {
        setSavedQA((data as QA[]) ?? [])
      }

      setFetchingSaved(false)
    }

    loadQuestions()
  }, [user])

  useEffect(() => {
    if (!pinnedStorageKey) return
    const savedPinned = window.localStorage.getItem(pinnedStorageKey)
    setPinnedIds(savedPinned ? JSON.parse(savedPinned) : [])
  }, [pinnedStorageKey])

  useEffect(() => {
    if (!pinnedStorageKey) return
    window.localStorage.setItem(pinnedStorageKey, JSON.stringify(pinnedIds))
  }, [pinnedIds, pinnedStorageKey])

  const askAi = async (message: string) => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'The AI request failed. Please try again.')
    }

    return data.reply as string
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus(null)

    if (input.trim().length < 10) {
      setStatus({
        type: 'error',
        text: 'Please enter a more detailed question with at least 10 characters.',
      })
      return
    }

    if (!navigator.onLine) {
      setStatus({
        type: 'error',
        text: 'You appear to be offline. Check your connection and try again.',
      })
      return
    }

    if (loading) {
      setStatus({
        type: 'error',
        text: 'Your previous request is still processing.',
      })
      return
    }

    setLoading(true)
    setAiResponse('')

    try {
      setAiResponse(await askAi(input))
      setTempDelete(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error'
      setStatus({ type: 'error', text: message })
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerate = async () => {
    if (!input.trim() || loading) return
    setLoading(true)
    setStatus(null)

    try {
      setAiResponse(await askAi(`Give a clearer, improved answer to this study question:\n\n${input}`))
      setTempDelete(true)
      setStatus({ type: 'success', text: 'Answer regenerated.' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error'
      setStatus({ type: 'error', text: message })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSummary = async (qa: QA) => {
    if (summarizingId) return
    setSummarizingId(qa.id)
    setStatus(null)

    try {
      const summary = await askAi(
        `Create concise revision notes for this saved answer. Use bullet points and include the key idea.\n\nQuestion: ${qa.question}\n\nAnswer: ${qa.answer}`
      )
      setSummaries((prev) => ({ ...prev, [qa.id]: summary }))
      setSelectedQuestionId(qa.id)
      setStatus({ type: 'success', text: 'Revision summary created.' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error'
      setStatus({ type: 'error', text: message })
    } finally {
      setSummarizingId(null)
    }
  }

  const togglePinned = (id: string) => {
    setPinnedIds((prev) =>
      prev.includes(id) ? prev.filter((savedId) => savedId !== id) : [id, ...prev]
    )
  }

  const handleSaveQA = async () => {
    if (!input.trim() || !aiResponse || !user || loading) return

    setLoading(true)
    setStatus(null)

    try {
      const normalizedSubject = subject.trim() || 'General'
      const { data, error } = await saveQuestion({
        userId: user.id,
        question: input.trim(),
        answer: aiResponse,
        subject: normalizedSubject,
      })

      if (error) throw new Error(error.message)

      if (data?.[0]) {
        setSavedQA((prev) => [data[0] as QA, ...prev])
      }

      clearDraft(setInput, setSubject, setAiResponse, setTempDelete)
      setStatus({ type: 'success', text: 'Question saved successfully.' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error'
      setStatus({ type: 'error', text: `Save failed: ${message}` })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSaved = async (id: string) => {
    setStatus(null)

    try {
      const { error } = await deleteQuestion(id)
      if (error) throw new Error(error.message)

      setSavedQA((prev) => prev.filter((qa) => qa.id !== id))
      if (editingId === id) setEditingId(null)
      setPinnedIds((prev) => prev.filter((savedId) => savedId !== id))
      setSummaries((prev) => {
        const copy = { ...prev }
        delete copy[id]
        return copy
      })
      setStatus({ type: 'success', text: 'Saved question deleted.' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error'
      setStatus({ type: 'error', text: message })
    } finally {
      setDeleteModalOpenId(null)
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editQuestion.trim()) {
      setStatus({ type: 'error', text: 'Question cannot be empty.' })
      return
    }

    setStatus(null)

    try {
      const normalizedSubject = editSubject.trim() || 'General'
      const { error } = await updateQuestion({
        id,
        question: editQuestion.trim(),
        subject: normalizedSubject,
      })

      if (error) throw new Error(error.message)

      setSavedQA((prev) =>
        prev.map((qa) =>
          qa.id === id
            ? { ...qa, question: editQuestion.trim(), subject: normalizedSubject }
            : qa
        )
      )

      setEditingId(null)
      setStatus({ type: 'success', text: 'Saved question updated.' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error'
      setStatus({ type: 'error', text: message })
    }
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        setStatus({ type: 'error', text: error.message })
        return
      }

      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
      setStatus({ type: 'error', text: 'Logout failed. Please try again.' })
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
    link.download = 'studyai-notes.txt'
    link.click()
    URL.revokeObjectURL(url)
    setStatus({ type: 'success', text: 'Notes exported as a text file.' })
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
          <title>StudyAI Notes</title>
          <style>
            body { font-family: Arial, sans-serif; color: #1f2937; padding: 32px; line-height: 1.6; }
            h1 { color: #115e59; }
            article { border-bottom: 1px solid #e7e5e4; padding: 20px 0; }
            .subject { color: #0f766e; font-weight: 700; text-transform: uppercase; font-size: 12px; letter-spacing: .12em; }
            pre { white-space: pre-wrap; font-family: inherit; }
          </style>
        </head>
        <body>
          <h1>StudyAI Notes</h1>
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

  const allSubjects = Array.from(new Set(savedQA.map((qa) => qa.subject || 'General'))).sort((a, b) =>
    a.localeCompare(b)
  )
  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredQA = savedQA
    .filter((qa) => {
      const matchesSubject = subjectFilter === 'All' || (qa.subject || 'General') === subjectFilter
      const matchesMode = filterMode === 'all' || pinnedIds.includes(qa.id)
      const matchesSearch =
        !normalizedSearch ||
        qa.question.toLowerCase().includes(normalizedSearch) ||
        qa.answer.toLowerCase().includes(normalizedSearch) ||
        (qa.subject || 'General').toLowerCase().includes(normalizedSearch)

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
  const sidebarSubjects = Array.from(new Set(filteredQA.map((qa) => qa.subject || 'General')))
  const pinnedQA = savedQA.filter((qa) => pinnedIds.includes(qa.id))
  const mostUsedSubject =
    allSubjects
      .map((sub) => ({
        sub,
        count: savedQA.filter((qa) => (qa.subject || 'General') === sub).length,
      }))
      .sort((a, b) => b.count - a.count)[0]?.sub || 'General'
  const exportItems = filteredQA.length > 0 ? filteredQA : savedQA

  const selectedQA = filteredQA.find((qa) => qa.id === selectedQuestionId) ?? null
  const draftLabel = aiResponse ? 'Answer ready' : loading ? 'Working' : 'Empty'
  const workspaceStats = [
    ['Saved answers', `${savedQA.length}`],
    ['Subjects', `${allSubjects.length || 0}`],
    ['Pinned notes', `${pinnedQA.length}`],
  ]
  const promptSuggestions = [
    {
      subject: 'Biology',
      question: 'Explain photosynthesis in simple steps and include a short exam summary.',
    },
    {
      subject: 'History',
      question: 'Summarize the main causes of World War I with three key dates.',
    },
    {
      subject: 'Math',
      question: 'Show me how to solve a quadratic equation step by step with one example.',
    },
  ]

  return (
    <Protected>
      <div
        className={`${
          darkMode ? 'page-shell bg-slate-950 text-stone-100' : 'page-shell bg-stone-50 text-slate-900'
        } min-h-screen transition-colors duration-300`}
      >
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
          <div className="grid flex-1 gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
            <aside
              className={`surface-panel rounded-3xl border p-5 ${
                darkMode
                  ? 'border-white/10 bg-slate-900/92'
                  : 'border-stone-200/80 bg-white/96'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${darkMode ? 'text-amber-200' : 'text-teal-800'}`}>
                    StudyAI
                  </p>
                  <h1 className="mt-2 text-2xl font-semibold">Workspace</h1>
                </div>
              </div>
              <div className={`mt-6 rounded-2xl p-4 ${darkMode ? 'bg-slate-800 text-slate-100' : 'bg-teal-900 text-teal-50'}`}>
                <p className="text-sm font-medium">Signed in as</p>
                <p className="mt-2 wrap-break-word text-sm leading-6 opacity-80">
                  {user.email ?? 'Signed in'}
                </p>
              </div>

              <div className="mt-6 space-y-3">
                {workspaceStats.map(([label, value]) => (
                  <div
                    key={label}
                    className={`rounded-2xl border p-4 ${
                      darkMode
                        ? 'border-white/10 bg-slate-800/80'
                        : 'border-stone-200 bg-stone-50'
                    }`}
                  >
                    <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${darkMode ? 'text-slate-400' : 'text-stone-500'}`}>
                      {label}
                    </p>
                    <p className="mt-3 wrap-break-word text-2xl font-semibold">{value}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={handleLogout}
                className={`app-button mt-6 w-full justify-center text-white ${
                  darkMode
                    ? 'bg-red-600 hover:bg-red-500'
                    : 'bg-teal-900 hover:bg-teal-800'
                }`}
              >
                Logout
              </button>

              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-800">
                    Questions
                  </h2>
                  <span className="text-xs text-stone-500">{filteredQA.length}</span>
                </div>

                {fetchingSaved ? (
                  <div className="space-y-2">
                    {[0, 1, 2].map((item) => (
                      <div
                        key={item}
                        className="h-16 animate-pulse rounded-2xl border border-stone-200 bg-stone-100"
                      />
                    ))}
                  </div>
                ) : filteredQA.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4 text-sm leading-6 text-stone-600">
                    No saved questions match your filters.
                  </div>
                ) : (
                  <div className="max-h-128 space-y-4 overflow-y-auto pr-1">
                    {sidebarSubjects.map((sub) => (
                      <div key={sub}>
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-800">
                            {sub}
                          </h3>
                          <span className="text-[11px] text-stone-500">
                            {filteredQA.filter((qa) => (qa.subject || 'General') === sub).length}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {filteredQA
                            .filter((qa) => (qa.subject || 'General') === sub)
                            .map((qa) => {
                              const selected = selectedQA?.id === qa.id

                              return (
                                <div key={qa.id} className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedQuestionId((currentId) => (currentId === qa.id ? null : qa.id))
                                      setDeleteModalOpenId(null)
                                      if (editingId !== qa.id) setEditingId(null)
                                    }}
                                    className={`min-w-0 flex-1 rounded-2xl border p-3 text-left transition ${
                                      selected
                                        ? 'border-teal-700 bg-teal-50'
                                        : 'border-stone-200 bg-stone-50 hover:border-teal-200 hover:bg-white'
                                    }`}
                                  >
                                    <p className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900">
                                      {qa.question}
                                    </p>
                                    {pinnedIds.includes(qa.id) && (
                                      <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-800">
                                        Pinned
                                      </p>
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => togglePinned(qa.id)}
                                    className={`app-button min-h-0 w-16 shrink-0 rounded-2xl border px-2 text-[11px] ${
                                      pinnedIds.includes(qa.id)
                                        ? 'border-teal-700 bg-teal-900 text-white hover:bg-teal-800'
                                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                                    }`}
                                  >
                                    {pinnedIds.includes(qa.id) ? 'Unpin' : 'Pin'}
                                  </button>
                                </div>
                              )
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>

            <main className="min-w-0 space-y-6">
              <section className={`glass-panel rounded-3xl border px-5 py-6 sm:px-7 ${
                darkMode
                  ? 'border-white/10 bg-slate-900/80'
                  : 'border-stone-200/80 bg-white/82'
              }`}>
                <div className="max-w-3xl">
                  <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${darkMode ? 'text-amber-200' : 'text-teal-800'}`}>
                    Study workspace
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
                    Ask better questions and keep the answers that matter.
                  </h2>
                  <p className={`mt-4 max-w-2xl text-sm leading-7 ${darkMode ? 'text-slate-300' : 'text-stone-600'}`}>
                    Keep your questions, answers, and subjects organized so every study session is easier to continue.
                  </p>
                </div>
              </section>

              <section className={`surface-panel rounded-3xl border p-5 sm:p-6 ${
                darkMode
                  ? 'border-white/10 bg-slate-900/92'
                  : 'border-stone-200/80 bg-white/96'
              }`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">Recent activity</h2>
                    <p className={`mt-2 text-sm leading-6 ${darkMode ? 'text-slate-400' : 'text-stone-600'}`}>
                      A quick snapshot of your saved study work.
                    </p>
                  </div>
                  <span className="rounded-full bg-teal-50 px-4 py-2 text-xs font-semibold text-teal-800">
                    {savedQA.length} total
                  </span>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {[
                    ['Last saved', savedQA[0]?.question || 'No saved notes yet'],
                    ['Top subject', mostUsedSubject],
                    ['Pinned', `${pinnedQA.length} important notes`],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{label}</p>
                      <p className="mt-3 line-clamp-2 text-sm font-semibold leading-6">{value}</p>
                    </div>
                  ))}
                </div>
              </section>

              <div className="space-y-6">
                <section className={`surface-panel rounded-3xl border p-5 sm:p-6 ${
                  darkMode
                    ? 'border-white/10 bg-slate-900/92'
                    : 'border-stone-200/80 bg-white/96'
                }`}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold">Ask the AI</h2>
                      <p className={`mt-2 text-sm leading-6 ${darkMode ? 'text-slate-400' : 'text-stone-600'}`}>
                        Write a detailed prompt, add an optional subject, and review the answer before deciding whether to save it.
                      </p>
                    </div>
                    <div
                      className={`inline-flex min-h-10 items-center rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                        loading
                          ? 'bg-orange-500/20 text-orange-700'
                          : aiResponse
                            ? 'bg-teal-500/18 text-teal-700'
                            : darkMode
                              ? 'bg-slate-800 text-slate-400'
                              : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {draftLabel}
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                      <span className={`mb-2 block text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-stone-700'}`}>
                        Quick prompts
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {promptSuggestions.map((prompt) => (
                          <button
                            type="button"
                            key={prompt.subject}
                            onClick={() => {
                              setSubject(prompt.subject)
                              setInput(prompt.question)
                              setStatus(null)
                            }}
                            disabled={loading}
                            className={`app-button min-h-10 border px-3 text-xs disabled:cursor-not-allowed disabled:opacity-60 ${
                              darkMode
                                ? 'border-white/10 bg-slate-800 text-slate-200 hover:bg-slate-700'
                                : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                            }`}
                          >
                            {prompt.subject}
                          </button>
                        ))}
                      </div>
                    </div>

                    <label className="block">
                      <span className={`mb-2 block text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-stone-700'}`}>
                        Question
                      </span>
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Explain the difference between mitosis and meiosis with an easy memory trick."
                        className={`min-h-52 w-full rounded-2xl border px-4 py-3 outline-none transition ${
                          darkMode
                            ? 'border-white/10 bg-slate-950/75 text-slate-100 placeholder:text-slate-500 focus:border-amber-300'
                            : 'border-stone-200 bg-stone-50 text-slate-900 placeholder:text-stone-400 focus:border-teal-700'
                        }`}
                        disabled={loading}
                      />
                    </label>

                    <label className="block">
                      <span className={`mb-2 block text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-stone-700'}`}>
                        Subject
                      </span>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Biology, algebra, history..."
                        className={`h-13 w-full rounded-2xl border px-4 outline-none transition ${
                          darkMode
                            ? 'border-white/10 bg-slate-950/75 text-slate-100 placeholder:text-slate-500 focus:border-amber-300'
                            : 'border-stone-200 bg-stone-50 text-slate-900 placeholder:text-stone-400 focus:border-teal-700'
                        }`}
                        disabled={loading}
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={loading || !input.trim()}
                      className={`app-button min-h-13 w-full justify-center disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-44 ${
                        darkMode
                          ? 'bg-amber-300 text-slate-950 hover:bg-amber-200'
                          : 'bg-teal-900 text-white hover:bg-teal-800'
                      }`}
                    >
                      {loading ? 'Thinking...' : 'Generate answer'}
                    </button>
                  </form>

                  {status && (
                    <div
                      className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
                        status.type === 'success'
                          ? darkMode
                            ? 'border-amber-300/30 bg-amber-950/35 text-amber-100'
                            : 'border-teal-200 bg-teal-50 text-teal-800'
                          : darkMode
                            ? 'border-red-500/30 bg-red-950/35 text-red-200'
                            : 'border-red-200 bg-red-50 text-red-700'
                      }`}
                    >
                      {status.text}
                    </div>
                  )}

                  {aiResponse && tempDelete && (
                    <div className={`mt-6 rounded-3xl border p-5 sm:p-6 ${
                      darkMode
                        ? 'border-amber-300/20 bg-amber-950/20'
                        : 'border-teal-200 bg-teal-50/80'
                    }`}>
                      <p className="text-sm font-semibold">Generated answer</p>
                      <p className={`mt-1 text-sm ${darkMode ? 'text-slate-400' : 'text-stone-600'}`}>
                        Save it if you want it in your long-term study history.
                      </p>
                      <p className="mt-4 whitespace-pre-wrap text-sm leading-7">{aiResponse}</p>
                      <div className="mt-5 flex flex-wrap justify-end gap-3">
                        <button
                          onClick={handleRegenerate}
                          disabled={loading}
                          className={`app-button min-w-36 border disabled:cursor-not-allowed disabled:opacity-60 ${
                            darkMode
                              ? 'border-white/10 bg-slate-800 text-slate-200 hover:bg-slate-700'
                              : 'border-teal-200 bg-white text-teal-800 hover:bg-teal-50'
                          }`}
                        >
                          Regenerate
                        </button>
                        <button
                          onClick={handleSaveQA}
                          disabled={loading}
                          className="app-button min-w-36 bg-teal-800 text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Save answer
                        </button>
                        <button
                          onClick={() => {
                            setStatus(null)
                            clearDraft(setInput, setSubject, setAiResponse, setTempDelete)
                          }}
                          disabled={loading}
                          className={`app-button min-w-34 border disabled:cursor-not-allowed disabled:opacity-60 ${
                            darkMode
                              ? 'border-white/10 bg-slate-800 text-slate-200 hover:bg-slate-700'
                              : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          Discard
                        </button>
                      </div>
                    </div>
                  )}
                </section>

                <section className={`surface-panel rounded-3xl border p-5 sm:p-6 ${
                  darkMode
                    ? 'border-white/10 bg-slate-900/92'
                    : 'border-stone-200/80 bg-white/96'
                }`}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold">Saved study library</h2>
                      <p className={`mt-2 text-sm leading-6 ${darkMode ? 'text-slate-400' : 'text-stone-600'}`}>
                        Browse saved questions by subject, expand answers when you need detail, and tidy the library without breaking your flow.
                      </p>
                    </div>
                    <div className={`inline-flex min-h-10 items-center rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                      darkMode ? 'bg-slate-800 text-slate-400' : 'bg-stone-100 text-stone-500'
                    }`}>
                      {fetchingSaved ? 'Syncing' : `${savedQA.length} items`}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                    <label className="block">
                      <span className={`mb-2 block text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-stone-700'}`}>
                        Search notes
                      </span>
                      <input
                        type="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by question, answer, or subject..."
                        className={`h-12 w-full rounded-2xl border px-4 outline-none transition ${
                          darkMode
                            ? 'border-white/10 bg-slate-950/75 text-slate-100 placeholder:text-slate-500 focus:border-amber-300'
                            : 'border-stone-200 bg-stone-50 text-slate-900 placeholder:text-stone-400 focus:border-teal-700'
                        }`}
                      />
                    </label>
                    <div className="flex items-end gap-2">
                      <button
                        type="button"
                        onClick={() => exportNotes(exportItems)}
                        className={`app-button min-h-12 border px-4 ${
                          darkMode
                            ? 'border-white/10 bg-slate-800 text-slate-200 hover:bg-slate-700'
                            : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        Export TXT
                      </button>
                      <button
                        type="button"
                        onClick={() => printNotes(exportItems)}
                        className="app-button min-h-12 bg-teal-900 px-4 text-white hover:bg-teal-800"
                      >
                        Print PDF
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {['All', ...allSubjects].map((sub) => (
                      <button
                        type="button"
                        key={sub}
                        onClick={() => setSubjectFilter(sub)}
                        className={`app-button min-h-10 border px-3 text-xs ${
                          subjectFilter === sub
                            ? 'bg-teal-900 text-white'
                            : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setFilterMode((mode) => (mode === 'pinned' ? 'all' : 'pinned'))}
                      className={`app-button min-h-10 border px-3 text-xs ${
                        filterMode === 'pinned'
                          ? 'bg-teal-900 text-white'
                          : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      Pinned only
                    </button>
                  </div>

                  <div className="mt-6">
                    {fetchingSaved ? (
                      <div className="space-y-3">
                        {[0, 1, 2].map((item) => (
                          <div
                            key={item}
                            className="h-28 animate-pulse rounded-3xl border border-stone-200 bg-stone-100"
                          />
                        ))}
                      </div>
                    ) : savedQA.length === 0 ? (
                      <div className={`rounded-3xl border border-dashed px-5 py-8 text-center ${
                        darkMode
                          ? 'border-white/10 bg-slate-800/70 text-slate-300'
                          : 'border-stone-300 bg-stone-50 text-stone-600'
                      }`}>
                        <p className="font-medium">No saved questions yet.</p>
                        <p className="mt-2 text-sm leading-6">
                          Generate an answer first, then save the ones you want to keep in your study history.
                        </p>
                        <div className="mt-5 flex flex-wrap justify-center gap-2">
                          {promptSuggestions.map((prompt) => (
                            <button
                              type="button"
                              key={prompt.subject}
                              onClick={() => {
                                setSubject(prompt.subject)
                                setInput(prompt.question)
                              }}
                              className="app-button min-h-10 border border-stone-200 bg-white px-3 text-xs text-stone-700 hover:bg-stone-50"
                            >
                              Try {prompt.subject}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : filteredQA.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 px-5 py-8 text-center text-stone-600">
                        <p className="font-medium">No matching notes found.</p>
                        <p className="mt-2 text-sm leading-6">
                          Try a different search term or clear the selected filters.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm('')
                            setSubjectFilter('All')
                            setFilterMode('all')
                          }}
                          className="app-button mt-5 bg-teal-900 text-white hover:bg-teal-800"
                        >
                          Clear filters
                        </button>
                      </div>
                    ) : (
                        <div className="rounded-3xl border border-stone-200 bg-stone-50/90 p-5">
                          {selectedQA && editingId === selectedQA.id ? (
                            <div className="space-y-3">
                              <input
                                type="text"
                                value={editQuestion}
                                onChange={(e) => setEditQuestion(e.target.value)}
                                className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-3 text-slate-900 outline-none"
                              />
                              <input
                                type="text"
                                value={editSubject}
                                onChange={(e) => setEditSubject(e.target.value)}
                                className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-3 text-slate-900 outline-none"
                              />
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => handleUpdate(selectedQA.id)}
                                  className="app-button min-w-37 bg-teal-900 text-white hover:bg-teal-800"
                                >
                                  Save changes
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="app-button min-w-32 bg-stone-200 text-stone-800 hover:bg-stone-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : selectedQA ? (
                            <div className="space-y-4">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-800">
                                    {selectedQA.subject || 'General'}
                                  </p>
                                  <h3 className="mt-3 text-xl font-semibold leading-8">
                                    {selectedQA.question}
                                  </h3>
                                </div>
                                {pinnedIds.includes(selectedQA.id) && (
                                  <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-800">
                                    Pinned
                                  </span>
                                )}
                              </div>

                              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                                {selectedQA.answer}
                              </p>

                              {summaries[selectedQA.id] && (
                                <div className="rounded-2xl border border-teal-200 bg-white p-4">
                                  <p className="text-sm font-semibold text-teal-800">Revision summary</p>
                                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7">
                                    {summaries[selectedQA.id]}
                                  </p>
                                </div>
                              )}

                              <div className="relative flex flex-wrap gap-2 pt-2">
                                <button
                                  onClick={() => {
                                    setEditingId(selectedQA.id)
                                    setEditQuestion(selectedQA.question)
                                    setEditSubject(selectedQA.subject || '')
                                  }}
                                  className="app-button min-w-28 bg-teal-900 text-white hover:bg-teal-800"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleCreateSummary(selectedQA)}
                                  disabled={summarizingId === selectedQA.id}
                                  className="app-button min-w-36 border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {summarizingId === selectedQA.id ? 'Summarizing...' : 'Summary'}
                                </button>
                                <button
                                  onClick={() => setDeleteModalOpenId(selectedQA.id)}
                                  className="app-button min-w-28 bg-red-600 text-white hover:bg-red-700"
                                >
                                  Delete
                                </button>

                                {deleteModalOpenId === selectedQA.id && (
                                  <div className="absolute right-0 top-full z-10 mt-2 w-[min(18rem,80vw)] rounded-3xl border border-stone-200 bg-white p-4 text-slate-800 shadow-xl">
                                    <p className="text-sm leading-6">
                                      Delete this saved question from your study history?
                                    </p>
                                    <div className="mt-4 flex justify-end gap-2">
                                      <button
                                        onClick={() => setDeleteModalOpenId(null)}
                                        className="app-button min-h-9 min-w-22 bg-stone-100 px-3 text-xs text-stone-700 hover:bg-stone-200"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => handleDeleteSaved(selectedQA.id)}
                                        className="app-button min-h-9 min-w-22 bg-red-600 px-3 text-xs text-white hover:bg-red-700"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white px-5 py-8 text-center text-stone-600">
                              <p className="font-medium">Select a question to open it.</p>
                              <p className="mt-2 text-sm leading-6">
                                Click the same question again to collapse it.
                              </p>
                            </div>
                          )}
                        </div>
                    )}
                  </div>
                </section>
              </div>
            </main>
          </div>
        </div>
      </div>
    </Protected>
  )
}
