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
import { useDarkMode } from '../lib/useDarkMode'

type StatusMessage = {
  type: 'success' | 'error'
  text: string
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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQuestion, setEditQuestion] = useState('')
  const [editSubject, setEditSubject] = useState('')
  const [deleteModalOpenId, setDeleteModalOpenId] = useState<string | null>(null)
  const [tempDelete, setTempDelete] = useState(false)
  const { darkMode } = useDarkMode()

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
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'The AI request failed. Please try again.')
      }

      setAiResponse(data.reply)
      setTempDelete(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error'
      setStatus({ type: 'error', text: message })
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
      setExpanded((prev) => {
        const copy = { ...prev }
        delete copy[id]
        return copy
      })

      if (editingId === id) setEditingId(null)
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

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  if (authLoading || !user) return null

  const grouped: Record<string, QA[]> = {}

  savedQA.forEach((qa) => {
    const sub = qa.subject || 'General'
    if (!grouped[sub]) grouped[sub] = []
    grouped[sub].push(qa)
  })

  const groupedSubjects = Object.keys(grouped)
  const draftLabel = aiResponse ? 'Answer ready' : loading ? 'Working' : 'Empty'

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
                {[
                  ['Saved questions', `${savedQA.length}`],
                  ['Subjects covered', `${groupedSubjects.length || 0}`],
                  ['Draft status', draftLabel],
                ].map(([label, value]) => (
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
                    <p className="mt-3 text-2xl font-semibold">{value}</p>
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

                  <div className="mt-6">
                    {fetchingSaved ? (
                      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-stone-600'}`}>Loading your saved questions...</p>
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
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {groupedSubjects.map((sub) => (
                          <div key={sub}>
                            <div className="mb-3 flex items-center justify-between">
                              <h3 className={`text-sm font-semibold uppercase tracking-[0.22em] ${darkMode ? 'text-amber-200' : 'text-teal-800'}`}>
                                {sub}
                              </h3>
                              <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-stone-500'}`}>
                                {grouped[sub].length} saved
                              </span>
                            </div>

                            <div className="space-y-3">
                              {grouped[sub].map((qa) => (
                                <div
                                  key={qa.id}
                                  className={`relative rounded-3xl border p-4 transition ${
                                    darkMode
                                      ? 'border-white/10 bg-slate-800/72'
                                      : 'border-stone-200 bg-stone-50/90'
                                  }`}
                                >
                                  <div
                                    onClick={() => toggleExpand(qa.id)}
                                    className="cursor-pointer pr-0 sm:pr-28"
                                  >
                                    {editingId === qa.id ? (
                                      <div className="space-y-3">
                                        <input
                                          type="text"
                                          value={editQuestion}
                                          onChange={(e) => setEditQuestion(e.target.value)}
                                          className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-3 text-slate-900 outline-none"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        <input
                                          type="text"
                                          value={editSubject}
                                          onChange={(e) => setEditSubject(e.target.value)}
                                          className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-3 text-slate-900 outline-none"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        <div className="flex flex-wrap gap-2">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleUpdate(qa.id)
                                            }}
                                            className={`app-button min-w-37 ${
                                              darkMode
                                                ? 'bg-amber-300 text-slate-950 hover:bg-amber-200'
                                                : 'bg-teal-900 text-white hover:bg-teal-800'
                                            }`}
                                          >
                                            Save changes
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setEditingId(null)
                                            }}
                                            className="app-button min-w-32 bg-stone-200 text-stone-800 hover:bg-stone-300"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <p className="text-sm font-semibold leading-6">
                                          {qa.question}
                                        </p>
                                        <p className={`mt-2 text-xs uppercase tracking-[0.2em] ${darkMode ? 'text-slate-500' : 'text-stone-500'}`}>
                                          Click to {expanded[qa.id] ? 'collapse' : 'expand'}
                                        </p>
                                        {expanded[qa.id] && (
                                          <div className="mt-4 space-y-3">
                                            <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${darkMode ? 'text-amber-200' : 'text-teal-800'}`}>
                                              {qa.subject || 'General'}
                                            </p>
                                            <p className="whitespace-pre-wrap text-sm leading-7">
                                              {qa.answer}
                                            </p>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                setEditingId(qa.id)
                                                setEditQuestion(qa.question)
                                                setEditSubject(qa.subject || '')
                                              }}
                                              className={`app-button min-w-32 ${
                                                darkMode
                                                  ? 'bg-amber-300 text-slate-950 hover:bg-amber-200'
                                                  : 'bg-teal-900 text-white hover:bg-teal-800'
                                              }`}
                                            >
                                              Edit entry
                                            </button>
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>

                                  {editingId !== qa.id && (
                                    <div className="mt-4 flex justify-end sm:absolute sm:right-4 sm:top-4 sm:mt-0">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setDeleteModalOpenId(qa.id)
                                        }}
                                        className="app-button min-h-10 min-w-28 bg-red-600 px-4 text-xs uppercase tracking-[0.12em] text-white hover:bg-red-700"
                                      >
                                        Delete
                                      </button>
                                      {deleteModalOpenId === qa.id && (
                                        <div
                                          className={`absolute right-0 top-full z-10 mt-2 w-[min(18rem,80vw)] rounded-3xl border p-4 shadow-xl ${
                                            darkMode
                                              ? 'border-white/10 bg-slate-900 text-slate-100'
                                              : 'border-stone-200 bg-white text-slate-800'
                                          }`}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <p className="text-sm leading-6">
                                            Delete this saved question from your study history?
                                          </p>
                                          <div className="mt-4 flex justify-end gap-2">
                                            <button
                                              onClick={() => setDeleteModalOpenId(null)}
                                              className={`app-button min-h-9 min-w-22 px-3 text-xs ${
                                                darkMode
                                                  ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                                                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                                              }`}
                                            >
                                              Cancel
                                            </button>
                                            <button
                                              onClick={() => handleDeleteSaved(qa.id)}
                                              className="app-button min-h-9 min-w-22 bg-red-600 px-3 text-xs text-white hover:bg-red-700"
                                            >
                                              Delete
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
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
