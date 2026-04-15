'use client'
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true })

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Failed to restore session:', error.message)
        }

        if (isMounted) {
          setUser(data.session?.user ?? null)
        }
      } catch (error) {
        console.error('Unexpected auth session error:', error)
        if (isMounted) {
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      isMounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
