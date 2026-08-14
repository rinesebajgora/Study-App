import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { createClient } from '@supabase/supabase-js'

type QuizQuestion = {
  id: string
  type: 'multiple_choice' | 'true_false' | 'open'
  question: string
  options?: string[]
  answer: string
  explanation: string
  topic: string
}

function normalizeQuestion(value: unknown, index: number): QuizQuestion | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  const rawType = String(item.type ?? '').toLowerCase().replace(/[- ]/g, '_')
  const type = rawType === 'multiple_choice' || rawType === 'true_false' || rawType === 'open' ? rawType : null
  const question = String(item.question ?? '').trim()
  const answer = String(item.answer ?? '').trim()
  const explanation = String(item.explanation ?? '').trim()
  const topic = String(item.topic ?? '').trim() || 'General'

  if (!type || !question || !answer || !explanation) return null

  if (type === 'multiple_choice') {
    const options = Array.isArray(item.options)
      ? item.options.map((option) => String(option).trim()).filter(Boolean).slice(0, 4)
      : []
    if (options.length !== 4 || !options.some((option) => option.toLowerCase() === answer.toLowerCase())) return null
    return { id: `q-${index + 1}`, type, question, options, answer, explanation, topic }
  }

  if (type === 'true_false') {
    const normalizedAnswer = /^(true|false)$/i.test(answer) ? answer[0].toUpperCase() + answer.slice(1).toLowerCase() : ''
    if (!normalizedAnswer) return null
    return { id: `q-${index + 1}`, type, question, options: ['True', 'False'], answer: normalizedAnswer, explanation, topic }
  }

  return { id: `q-${index + 1}`, type, question, answer, explanation, topic }
}

function parseQuiz(reply: string) {
  const clean = reply.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim()
  const parsed = JSON.parse(clean) as { questions?: unknown }
  if (!Array.isArray(parsed.questions)) return []
  return parsed.questions.map(normalizeQuestion).filter((question): question is QuizQuestion => Boolean(question)).slice(0, 8)
}

function fallbackQuiz(material: string): QuizQuestion[] {
  const facts = material
    .replaceAll('\r\n', '\n')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 30)
    .slice(0, 3)

  const firstFact = facts[0] ?? 'Review the supplied study material and explain its main idea.'
  return [
    {
      id: 'q-1',
      type: 'open',
      question: 'Explain the main idea from this study material in your own words.',
      answer: firstFact,
      explanation: 'A strong answer should identify the main concept and connect it to the material.',
      topic: 'Core concepts',
    },
    {
      id: 'q-2',
      type: 'true_false',
      question: `True or false: this statement appears in the material: "${firstFact}"`,
      options: ['True', 'False'],
      answer: 'True',
      explanation: 'The statement was taken directly from the supplied material.',
      topic: 'Core concepts',
    },
  ]
}

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization')
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'You must be logged in to create a quiz.' }, { status: 401 })
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Supabase is not configured yet.' }, { status: 500 })
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authorization } },
    })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Your session expired. Please log in again.' }, { status: 401 })

    const body = await request.json()
    const material = typeof body.material === 'string' ? body.material.trim() : ''
    const subject = typeof body.subject === 'string' && body.subject.trim() ? body.subject.trim() : 'General'
    if (material.length < 80) return NextResponse.json({ error: 'Add more study material before generating a quiz.' }, { status: 400 })

    if (!process.env.GROQ_API_KEY) return NextResponse.json({ questions: fallbackQuiz(material), fallback: true })

    const client = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const completion = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You create accurate study quizzes using only the supplied material. Return only valid JSON.' },
        { role: 'user', content: `Subject: ${subject}\n\nStudy material:\n${material.slice(0, 18000)}\n\nCreate exactly 6 questions: 3 multiple-choice, 2 true/false, and 1 open question. Return only this JSON shape:\n{"questions":[{"type":"multiple_choice","topic":"short topic name","question":"...","options":["...","...","...","..."],"answer":"the exact correct option","explanation":"brief explanation"},{"type":"true_false","topic":"short topic name","question":"...","answer":"True","explanation":"brief explanation"},{"type":"open","topic":"short topic name","question":"...","answer":"model answer","explanation":"what a good answer includes"}]}\n\nRules: use only facts from the material; multiple-choice options must contain exactly four choices; use a concise topic label for each question; do not use markdown.` },
      ],
      max_tokens: 1800,
    })
    const reply = completion.choices[0]?.message?.content?.trim()
    const questions = reply ? parseQuiz(reply) : []
    return NextResponse.json({ questions: questions.length >= 4 ? questions : fallbackQuiz(material), fallback: questions.length < 4 })
  } catch (error) {
    console.error('Quiz generation error:', error)
    return NextResponse.json({ error: 'We could not generate a quiz right now. Please try again.' }, { status: 500 })
  }
}
