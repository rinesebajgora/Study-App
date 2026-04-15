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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-700">
        <p>Checking your session...</p>
      </div>
    )
  }

  if (!user) return null
  return <>{children}</>
}
