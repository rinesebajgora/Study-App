'use client'

import React, { useState, useEffect } from 'react'
import Protected from '../components/Protected'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'

interface QA {
  question: string
  answer: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [input, setInput] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [savedQA, setSavedQA] = useState<QA[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  // Fetch saved QAs
  useEffect(() => {
    if (!user) return

    const fetchQA = async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('question, answer')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        setError('Gabim gjatë marrjes së të dhënave: ' + error.message)
        return
      }

      if (data) setSavedQA(data as QA[])
    }

    fetchQA()
  }, [user])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim()) return

    setLoading(true)
    setError('')
    setAiResponse('')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      })

      if (!res.ok) throw new Error('Server error')
      const data = await res.json()
      console.log('AI Response:', data.reply) // kontrollo në console
      setAiResponse(data.reply)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveQA = async () => {
    if (!input.trim() || !aiResponse || !user) return

    setLoading(true)
    setError('')

    try {
      const { error } = await supabase
        .from('questions')
        .insert([{ user_id: user.id, question: input, answer: aiResponse }])

      if (error) {
        setError('Gabim gjatë ruajtjes: ' + error.message)
        return
      }

      setSavedQA([{ question: input, answer: aiResponse }, ...savedQA])
      setInput('')
      setAiResponse('')
    } catch (err: any) {
      setError('Gabim: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  if (!user) return <p>Duke kontrolluar sesionin...</p>

  return (
    <Protected>
      <div style={{ maxWidth: '700px', margin: '30px auto', padding: '20px', background: 'white', borderRadius: '12px', boxShadow: '0 3px 12px rgba(0,0,0,0.08)' }}>
        <h2 style={{ fontSize: '26px', marginBottom: '10px', textAlign: 'center' }}>AI Study Assistant</h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Shkruaj pyetjen këtu..."
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', minHeight: '90px', resize: 'vertical' }}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()} style={{ background: '#2563eb', color: 'white', padding: '10px', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? "Po gjenerohet..." : "Merr përgjigjen nga AI"}
          </button>
        </form>

        {/* AI Response */}
        {aiResponse && (
          <div style={{ background: '#e6ffed', padding: '14px', borderRadius: '8px', border: '1px solid #b7f5c9', marginBottom: '10px', position: 'relative', overflow: 'visible' }}>
            <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{aiResponse}</p>
            <button
              onClick={handleSaveQA}
              style={{ marginTop: '8px', background: '#16a34a', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'block' }}
            >
              Save
            </button>
          </div>
        )}

        {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}

        <h3 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '18px' }}>Pyetjet e ruajtura</h3>
        {savedQA.length === 0 && <p style={{ fontSize: '14px', color: '#555' }}>Nuk ka pyetje të ruajtura.</p>}
        {savedQA.map((qa, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: '8px',
              padding: '10px',
              background: '#f3f4f6',
              borderRadius: '6px',
              fontSize: '14px',
              position: 'relative',
              cursor: 'pointer',
            }}
          >
            <p
              style={{
                margin: '2px 0',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              onClick={() => toggleExpand(idx)}
            >
              <strong>Pyetja:</strong> {qa.question}
            </p>

            {expandedIndex === idx && (
              <p style={{ margin: '2px 0', color: '#333', whiteSpace: 'pre-wrap' }}>
                <strong>Përgjigja:</strong> {qa.answer}
              </p>
            )}

            {expandedIndex !== idx && (
              <span
                style={{ position: 'absolute', right: '10px', top: '10px', fontSize: '14px', color: '#555' }}
                onClick={() => toggleExpand(idx)}
              >
                ...
              </span>
            )}
          </div>
        ))}

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button onClick={handleLogout} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#ef4444', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>
    </Protected>
  )
}