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
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('darkMode') === 'true'
  })
  const [deleteModalOpenId, setDeleteModalOpenId] = useState<string | null>(null)
  const [tempDelete, setTempDelete] = useState(false)

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

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      localStorage.setItem('darkMode', (!prev).toString())
      return !prev
    })
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
      setStatus({
        type: 'success',
        text: 'Answer ready. Save it if you want to keep it in your study history.',
      })
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

  return (
    <Protected>
      <div
        className={`${
          darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'
        } min-h-screen flex flex-col items-center p-6 transition-colors duration-300`}
      >
        <div className="absolute top-4 right-4">
          <button
            onClick={toggleDarkMode}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm rounded shadow transition-colors duration-200"
          >
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

        <div className="w-full max-w-3xl flex justify-between items-center mb-5">
          <h1 className="text-2xl font-bold">AI Study Assistant</h1>

          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg shadow font-semibold transition"
          >
            Logout
          </button>
        </div>

        <div
          className={`${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } w-full max-w-3xl p-6 rounded-xl shadow-lg border transition-colors duration-300`}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-5">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your question..."
              className={`${
                darkMode
                  ? 'bg-gray-700 text-gray-100 border-gray-600 placeholder-gray-300'
                  : 'bg-gray-50 text-gray-800 border-gray-300 placeholder-gray-500'
              } p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-25 shadow-sm transition-colors duration-300`}
              disabled={loading}
            />
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject (optional)"
              className={`${
                darkMode
                  ? 'bg-gray-700 text-gray-100 border-gray-600 placeholder-gray-300'
                  : 'bg-gray-50 text-gray-800 border-gray-300 placeholder-gray-500'
              } p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors duration-300`}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg shadow font-semibold transition disabled:opacity-50"
            >
              {loading ? 'Thinking...' : 'Ask AI'}
            </button>
          </form>

          {loading && <p className="text-gray-400 mb-2">AI is thinking...</p>}

          {status && (
            <div
              className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
                status.type === 'success'
                  ? darkMode
                    ? 'border-green-700 bg-green-950 text-green-100'
                    : 'border-green-200 bg-green-50 text-green-800'
                  : darkMode
                    ? 'border-red-700 bg-red-950 text-red-100'
                    : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {status.text}
            </div>
          )}

          {aiResponse && tempDelete && (
            <div
              className={`${
                darkMode
                  ? 'bg-green-900 border-green-700 text-gray-100'
                  : 'bg-green-50 border-green-200 text-gray-800'
              } border p-4 rounded-lg mb-4 shadow-sm transition-colors duration-300 relative`}
            >
              <p className="whitespace-pre-wrap">{aiResponse}</p>
              <div className="flex gap-2 mt-2 justify-end">
                <button
                  onClick={handleSaveQA}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg shadow font-semibold transition disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() =>
                    clearDraft(setInput, setSubject, setAiResponse, setTempDelete)
                  }
                  disabled={loading}
                  className="bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg shadow font-semibold transition disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          )}

          {fetchingSaved ? (
            <p className="text-sm text-gray-400">Loading your saved questions...</p>
          ) : savedQA.length === 0 ? (
            <div
              className={`rounded-xl border border-dashed p-6 text-center ${
                darkMode
                  ? 'border-gray-600 bg-gray-900/50 text-gray-300'
                  : 'border-gray-300 bg-gray-50 text-gray-600'
              }`}
            >
              <p className="font-medium">No saved questions yet.</p>
              <p className="mt-1 text-sm">
                Ask the AI something above, then save the answer to build your study
                history.
              </p>
            </div>
          ) : (
            Object.keys(grouped).map((sub) => (
              <div key={sub} className="mb-4">
                <h3 className="text-lg font-semibold mb-2 text-indigo-500 border-b border-indigo-300 pb-1">
                  {sub}
                </h3>
                <div className="space-y-3">
                  {grouped[sub].map((qa) => (
                    <div
                      key={qa.id}
                      className={`${
                        darkMode
                          ? 'bg-gray-700 border-gray-600'
                          : 'bg-gray-50 border-gray-200'
                      } relative border p-3 rounded-xl shadow hover:shadow-md transition-colors duration-300`}
                    >
                      <div
                        onClick={() => toggleExpand(qa.id)}
                        className="cursor-pointer pr-20"
                      >
                        {editingId === qa.id ? (
                          <>
                            <input
                              type="text"
                              value={editQuestion}
                              onChange={(e) => setEditQuestion(e.target.value)}
                              className="w-full mb-1 p-2 border rounded outline-none text-gray-900"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <input
                              type="text"
                              value={editSubject}
                              onChange={(e) => setEditSubject(e.target.value)}
                              className="w-full mb-1 p-2 border rounded outline-none text-gray-900"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleUpdate(qa.id)
                              }}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg shadow font-semibold transition mr-2"
                            >
                              Save Update
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingId(null)
                              }}
                              className="bg-gray-400 hover:bg-gray-500 text-white py-2 px-4 rounded-lg shadow font-semibold transition"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <p className="truncate font-medium">
                              <strong>Q:</strong> {qa.question}
                            </p>
                            {expanded[qa.id] && (
                              <>
                                <p className="mt-1 text-sm text-indigo-400">
                                  Subject: {qa.subject || 'General'}
                                </p>
                                <p className="mt-1 whitespace-pre-wrap">
                                  <strong>A:</strong> {qa.answer}
                                </p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingId(qa.id)
                                    setEditQuestion(qa.question)
                                    setEditSubject(qa.subject || '')
                                  }}
                                  className="mt-2 bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded shadow mr-2"
                                >
                                  Update
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>

                      {editingId !== qa.id && (
                        <div className="absolute top-3 right-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteModalOpenId(qa.id)
                            }}
                            className="text-xs px-3 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white"
                          >
                            Delete
                          </button>
                          {deleteModalOpenId === qa.id && (
                            <div
                              className={`${
                                darkMode
                                  ? 'bg-gray-800 text-gray-100 border-gray-700'
                                  : 'bg-white text-gray-800 border-gray-200'
                              } border p-3 rounded-lg shadow-lg mt-2 absolute right-0 w-64 z-10`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <p className="mb-2 text-sm">
                                Are you sure you want to delete this question?
                              </p>
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => setDeleteModalOpenId(null)}
                                  className="px-2 py-1 text-xs rounded bg-gray-400 hover:bg-gray-500 text-white"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleDeleteSaved(qa.id)}
                                  className="px-2 py-1 text-xs rounded bg-red-500 hover:bg-red-600 text-white"
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
            ))
          )}
        </div>
      </div>
    </Protected>
  )
}
