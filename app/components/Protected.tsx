'use client'
import React, { ReactNode, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/navigation'

export default function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user === null) router.push('/login')
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center px-6">
        <div className="glass-panel rounded-3xl border border-stone-200/70 bg-white/85 px-8 py-8 text-center text-slate-700">
          <div className="mx-auto h-12 w-12 animate-pulse rounded-2xl bg-teal-700/20" />
          <p className="mt-4 text-sm font-medium">Checking your session...</p>
          <p className="mt-2 text-sm text-stone-500">
            Restoring your workspace and saved history.
          </p>
        </div>
      </div>
    )
  }

  if (!user) return null
  return <>{children}</>
}
