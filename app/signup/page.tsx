'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AuthShell from '../components/AuthShell'
import { supabase } from '../lib/supabase'
import { useDarkMode } from '../lib/useDarkMode'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { darkMode } = useDarkMode()

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (loading) return

    setLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { name: name.trim() } },
      })

      if (error) {
        setError(error.message)
        return
      }

      setSuccess('Account created. Please check your email for verification.')
      router.push('/login')
    } catch (error) {
      console.error('Signup failed:', error)
      setError('Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      darkMode={darkMode}
      eyebrow="Start fresh"
      title="Create a study workspace that keeps everything in one place."
      subtitle="Set up in a minute, ask AI for explanations, and save the answers you want to revisit later."
    >
      <div className="w-full">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold">Create account</h2>
          <p className={`mt-3 text-sm leading-6 ${darkMode ? 'text-slate-400' : 'text-stone-600'}`}>
            Build your account and start collecting answers worth reviewing later.
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <label className="block">
            <span className={`mb-2 block text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-stone-700'}`}>
              Name
            </span>
            <input
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              className={`h-13 w-full rounded-2xl border px-4 outline-none transition ${
                darkMode
                  ? 'border-white/10 bg-slate-950/70 text-slate-100 placeholder:text-slate-500 focus:border-amber-300'
                  : 'border-stone-200 bg-stone-50 text-slate-900 placeholder:text-stone-400 focus:border-teal-700'
              }`}
            />
          </label>

          <label className="block">
            <span className={`mb-2 block text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-stone-700'}`}>
              Email
            </span>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className={`h-13 w-full rounded-2xl border px-4 outline-none transition ${
                darkMode
                  ? 'border-white/10 bg-slate-950/70 text-slate-100 placeholder:text-slate-500 focus:border-amber-300'
                  : 'border-stone-200 bg-stone-50 text-slate-900 placeholder:text-stone-400 focus:border-teal-700'
              }`}
            />
          </label>

          <label className="block">
            <span className={`mb-2 block text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-stone-700'}`}>
              Password
            </span>
            <input
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className={`h-13 w-full rounded-2xl border px-4 outline-none transition ${
                darkMode
                  ? 'border-white/10 bg-slate-950/70 text-slate-100 placeholder:text-slate-500 focus:border-amber-300'
                  : 'border-stone-200 bg-stone-50 text-slate-900 placeholder:text-stone-400 focus:border-teal-700'
              }`}
            />
          </label>

          {error && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                darkMode
                  ? 'border-red-500/30 bg-red-950/40 text-red-200'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                darkMode
                  ? 'border-amber-300/30 bg-amber-950/40 text-amber-100'
                  : 'border-teal-200 bg-teal-50 text-teal-800'
              }`}
            >
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`app-button min-h-[3.25rem] w-full justify-center disabled:cursor-not-allowed disabled:opacity-60 ${
              darkMode
                ? 'bg-amber-300 text-slate-950 hover:bg-amber-200'
                : 'bg-teal-900 text-white hover:bg-teal-800'
            }`}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className={`mt-6 flex flex-wrap items-center justify-between gap-3 text-sm ${darkMode ? 'text-slate-400' : 'text-stone-600'}`}>
          <span>Already registered?</span>
          <Link
            href="/login"
            className={`rounded-lg px-1 py-1 font-semibold ${darkMode ? 'text-amber-200' : 'text-teal-800'}`}
          >
            Go to login
          </Link>
        </div>
      </div>
    </AuthShell>
  )
}
