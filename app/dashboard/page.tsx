'use client'

import React, { useState, useEffect } from 'react'
import Protected from '../components/Protected'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'

interface QA {
  id: string
  question: string
  answer: string
  subject?: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [input, setInput] = useState('')
  const [subject, setSubject] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [savedQA, setSavedQA] = useState<QA[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQuestion, setEditQuestion] = useState('')
  const [editSubject, setEditSubject] = useState('')
  const [darkMode, setDarkMode] = useState(false)
  const [deleteModalOpenId, setDeleteModalOpenId] = useState<string | null>(null)
  const [tempDelete, setTempDelete] = useState(false) // për pyetje jo të ruajtura

  // Load dark mode nga localStorage
  useEffect(() => {
    const dm = localStorage.getItem('darkMode')
    if (dm === 'true') setDarkMode(true)
  }, [])

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      localStorage.setItem('darkMode', (!prev).toString())
      return !prev
    })
  }

  // Fetch saved QA
  useEffect(() => {
    if (!user) return
    const fetchQA = async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('id, question, answer, subject')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) setError('Error fetching data: ' + error.message)
      if (data) setSavedQA(data as QA[])
    }
    fetchQA()
  }, [user])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    // 🔹 Edge Case #1: Input shumë i shkurtër
    if (input.trim().length < 10) {
      setError('Ju lutem shkruani një pyetje më të detajuar (minimum 10 karaktere).')
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
      if (!res.ok) throw new Error('Server error')
      const data = await res.json()
      setAiResponse(data.reply)
      setTempDelete(true)
    } catch (err: any) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  const handleSaveQA = async () => {
    if (!input.trim() || !aiResponse || !user) return
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase
        .from('questions')
        .insert([{ user_id: user.id, question: input, answer: aiResponse, subject: subject || 'General' }])
        .select()
      if (error) throw new Error(error.message)
      if (data) setSavedQA([data[0] as QA, ...savedQA])
      setInput('')
      setAiResponse('')
      setSubject('')
      setTempDelete(false)
    } catch (err: any) { setError('Error: ' + err.message) }
    finally { setLoading(false) }
  }

  const handleDeleteSaved = async (id: string) => {
    setError('')
    try {
      const { error } = await supabase.from('questions').delete().eq('id', id)
      if (error) throw new Error(error.message)
      setSavedQA(savedQA.filter((qa) => qa.id !== id))
      setExpanded((prev) => {
        const copy = { ...prev }
        delete copy[id]
        return copy
      })
      if (editingId === id) setEditingId(null)
    } catch (err: any) { setError(err.message) }
    finally { setDeleteModalOpenId(null) }
  }

  const handleUpdate = async (id: string) => {
    if (!editQuestion.trim()) return
    setError('')
    try {
      const { error, data } = await supabase
        .from('questions')
        .update({ question: editQuestion, subject: editSubject || 'General' })
        .eq('id', id)
        .select()
      if (error) throw new Error(error.message)
      if (data) {
        setSavedQA(savedQA.map((qa) => qa.id === id ? { ...qa, question: editQuestion, subject: editSubject } : qa))
      }
      setEditingId(null)
    } catch (err: any) { setError(err.message) }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  if (!user) return <p>Checking session...</p>

  const grouped: { [key: string]: QA[] } = {}
  savedQA.forEach((qa) => {
    const sub = qa.subject || 'General'
    if (!grouped[sub]) grouped[sub] = []
    grouped[sub].push(qa)
  })

  return (
    <Protected>
      <div className={`${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'} min-h-screen flex flex-col items-center p-6 transition-colors duration-300`}>

{/* Dark Mode Button – top right i faqes */}
<div className="absolute top-4 right-4">
  <button
    onClick={toggleDarkMode}
    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm rounded shadow transition-colors duration-200"
  >
    {darkMode ? 'Light Mode' : 'Dark Mode'}
  </button>
</div>
{/* Navbar */}
<div className="w-full max-w-3xl flex justify-between items-center mb-5">
  <h1 className="text-2xl font-bold">AI Study Assistant</h1>

  <button
    onClick={handleLogout}
    className="bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg shadow font-semibold transition"
  >
    Logout
  </button>
</div>
        {/* Main Card */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} w-full max-w-3xl p-6 rounded-xl shadow-lg border transition-colors duration-300`}>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-5">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your question..."
              className={`${darkMode ? 'bg-gray-700 text-gray-100 border-gray-600 placeholder-gray-300' : 'bg-gray-50 text-gray-800 border-gray-300 placeholder-gray-500'} p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-25 shadow-sm transition-colors duration-300`}
              disabled={loading}
            />
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject (optional)"
              className={`${darkMode ? 'bg-gray-700 text-gray-100 border-gray-600 placeholder-gray-300' : 'bg-gray-50 text-gray-800 border-gray-300 placeholder-gray-500'} p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors duration-300`}
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

          {/* AI Response not saved */}
          {aiResponse && tempDelete && (
            <div className={`${darkMode ? 'bg-green-900 border-green-700 text-gray-100' : 'bg-green-50 border-green-200 text-gray-800'} border p-4 rounded-lg mb-4 shadow-sm transition-colors duration-300 relative`}>
              <p className="whitespace-pre-wrap">{aiResponse}</p>
              <div className="flex gap-2 mt-2 justify-end">
                <button
                  onClick={handleSaveQA}
                  className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg shadow font-semibold transition"
                >
                  Save
                </button>
                <button
                  onClick={() => { setAiResponse(''); setInput(''); setSubject(''); setTempDelete(false) }}
                  className="bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg shadow font-semibold transition"
                >
                  Delete
                </button>
              </div>
            </div>
          )}

          {error && <p className="text-red-500 mb-2">{error}</p>}

          {/* Saved Questions */}
          {Object.keys(grouped).map((sub) => (
            <div key={sub} className="mb-4">
              <h3 className="text-lg font-semibold mb-2 text-indigo-500 border-b border-indigo-300 pb-1">{sub}</h3>
              <div className="space-y-3">
                {grouped[sub].map((qa) => (
                  <div
                    key={qa.id}
                    className={`${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} relative border p-3 rounded-xl shadow hover:shadow-md transition-colors duration-300`}
                  >
                    <div onClick={() => toggleExpand(qa.id)} className="cursor-pointer">
                      {editingId === qa.id ? (
                        <>
                          <input
                            type="text"
                            value={editQuestion}
                            onChange={(e) => setEditQuestion(e.target.value)}
                            className="w-full mb-1 p-1 border rounded outline-none"
                          />
                          <input
                            type="text"
                            value={editSubject}
                            onChange={(e) => setEditSubject(e.target.value)}
                            className="w-full mb-1 p-1 border rounded outline-none"
                          />
                          <button
                            onClick={() => handleUpdate(qa.id)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white py-3 px-4 rounded-lg shadow font-semibold transition mr-2"
                          >
                            Save Update
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="bg-gray-400 hover:bg-gray-500 text-white py-3 px-4 rounded-lg shadow font-semibold transition"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="truncate font-medium"><strong>Q:</strong> {qa.question}</p>
                          {expanded[qa.id] && (
                            <>
                              <p className="mt-1 whitespace-pre-wrap"><strong>A:</strong> {qa.answer}</p>
                              <button
                                onClick={() => {
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
                    {/* Delete saved QA */}
                    {editingId !== qa.id && (
                      <div className="absolute top-3 right-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteModalOpenId(qa.id) }}
                          className="text-xs px-3 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white"
                        >
                          Delete
                        </button>
                        {deleteModalOpenId === qa.id && (
                          <div className={`${darkMode ? 'bg-gray-800 text-gray-100 border-gray-700' : 'bg-white text-gray-800 border-gray-200'} border p-3 rounded-lg shadow-lg mt-2 absolute right-0 w-64 z-10`}>
                            <p className="mb-2 text-sm">Are you sure you want to delete this question?</p>
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
          ))}

        </div>
      </div>
    </Protected>
  )
}