'use client'
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [darkMode, setDarkMode] = useState(false)

  // Load dark mode from localStorage
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

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else router.push('/dashboard')
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: darkMode ? '#1e1e1e' : '#f5f5f5',
      color: darkMode ? '#f0f0f0' : '#1e1e1e',
      transition: 'all 0.3s',
      position: 'relative',
      padding: '16px'
    }}>
      {/* Dark Mode Toggle */}
      <button
        onClick={toggleDarkMode}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '4px 8px',
          fontSize: '12px',
          borderRadius: '4px',
          background: darkMode ? '#444' : '#ddd',
          color: darkMode ? '#fff' : '#000',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        {darkMode ? 'Light Mode' : 'Dark Mode'}
      </button>

      {/* Form */}
      <form
        onSubmit={handleLogin}
        style={{
          background: darkMode ? '#333' : 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          transition: 'all 0.3s'
        }}
      >
        <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 'bold', textAlign: 'center' }}>Login</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            fontSize: '14px',
            background: darkMode ? '#555' : 'white',
            color: darkMode ? '#f0f0f0' : '#000'
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            fontSize: '14px',
            background: darkMode ? '#555' : 'white',
            color: darkMode ? '#f0f0f0' : '#000'
          }}
        />

        <button
          type="submit"
          style={{
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            background: '#2563eb',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: '0.2s'
          }}
        >
          Login
        </button>

        {error && <p style={{ color: 'red', textAlign: 'center', fontSize: '14px' }}>{error}</p>}

        <p style={{ textAlign: 'center', fontSize: '14px', marginTop: '12px' }}>
          Don't have an account? <Link href="/signup" style={{ color: '#2563eb', fontWeight: 'bold' }}>Sign Up</Link>
        </p>
      </form>
    </div>
  )
}