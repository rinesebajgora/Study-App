'use client'
import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!email.includes('@')) { setError('Email not valid'); return }
    if (password.length < 6) { setError('Password min 6 characters'); return }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    })

    if (error) setError(error.message)
    else {
      alert('Control email for verification')
      router.push('/login')
    }
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#f5f5f5'
    }}>
      <form
        onSubmit={handleSignup}
        style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 'bold', textAlign: 'center' }}>SignUp</h2>

        <input
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px' }}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px' }}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px' }}
          required
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
          Signup
        </button>

        {error && <p style={{ color: 'red', textAlign: 'center', fontSize: '14px' }}>{error}</p>}

        <p style={{ textAlign: 'center', fontSize: '14px', marginTop: '12px' }}>
          Already have an account? <Link href="/login" style={{ color: '#2563eb', fontWeight: 'bold' }}>LogIn</Link>
        </p>
      </form>
    </div>
  )
}