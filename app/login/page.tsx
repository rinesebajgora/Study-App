'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AuthShell from '../components/AuthShell'
import { supabase } from '../lib/supabase'
import { useDarkMode } from '../lib/useDarkMode'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { darkMode } = useDarkMode()

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (loading) return

    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        setError(error.message)
        return
      }

      router.push('/dashboard')
    } catch (error) {
      console.error('Login failed:', error)
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      darkMode={darkMode}
      eyebrow="Welcome back"
      title="Pick up your study session without any friction."
      subtitle="Log in to ask new questions, organize answers by subject, and keep your study workflow in one polished workspace."
    >
      <div className="w-full">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold">Log in</h2>
          <p className={`mt-3 text-sm leading-6 ${darkMode ? 'text-slate-400' : 'text-stone-600'}`}>
            Your saved answers and active study workflow are waiting for you.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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
              placeholder="Enter your password"
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

          <button
            type="submit"
            disabled={loading}
            className={`app-button min-h-[3.25rem] w-full justify-center disabled:cursor-not-allowed disabled:opacity-60 ${
              darkMode
                ? 'bg-amber-300 text-slate-950 hover:bg-amber-200'
                : 'bg-teal-900 text-white hover:bg-teal-800'
            }`}
          >
            {loading ? 'Logging in...' : 'Continue to dashboard'}
          </button>
        </form>

        <div className={`mt-6 flex flex-wrap items-center justify-between gap-3 text-sm ${darkMode ? 'text-slate-400' : 'text-stone-600'}`}>
          <span>Need an account?</span>
          <Link
            href="/signup"
            className={`rounded-lg px-1 py-1 font-semibold ${darkMode ? 'text-amber-200' : 'text-teal-800'}`}
          >
            Create one now
          </Link>
        </div>
      </div>
    </AuthShell>
  )
}
