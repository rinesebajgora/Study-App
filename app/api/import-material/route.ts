import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { createClient } from '@supabase/supabase-js'

type ImportedCard = {
  front: string
  back: string
}

function normalizeCards(value: unknown): ImportedCard[] {
  if (!Array.isArray(value)) return []
  const used = new Set<string>()

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const front = 'front' in item ? String(item.front ?? '').trim() : ''
      const back = 'back' in item ? String(item.back ?? '').trim() : ''
      if (!front || !back) return null

      return {
        front: front.endsWith('?') ? front : `${front}?`,
        back,
      }
    })
    .filter((item): item is ImportedCard => Boolean(item))
    .filter((item) => {
      const key = item.front.toLowerCase().replace(/\s+/g, ' ').trim()
      if (used.has(key)) return false
      used.add(key)
      return true
    })
    .slice(0, 8)
}

function parseImportPayload(reply: string) {
  const jsonText = reply
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim()
  const parsed = JSON.parse(jsonText) as {
    title?: unknown
    note?: unknown
    flashcards?: unknown
  }
  const title = String(parsed.title ?? 'Imported study material').trim()
  const note = String(parsed.note ?? '').trim()
  const flashcards = normalizeCards(parsed.flashcards)

  if (!note || flashcards.length === 0) {
    throw new Error('Import output was incomplete.')
  }

  return { title, note, flashcards }
}

function createFallbackImport(material: string) {
  const sentences = material
    .replaceAll('\r\n', '\n')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 30)
    .slice(0, 6)
  const note = [
    'Key points:',
    ...sentences.slice(0, 5).map((sentence) => `- ${sentence}`),
    '',
    'Practice focus:',
    '- Review the key terms and explain the main ideas in your own words.',
  ].join('\n')

  return {
    title: 'Imported study material',
    note,
    flashcards: sentences.slice(0, 5).map((sentence, index) => ({
      front: `What is key idea ${index + 1} from this material?`,
      back: sentence,
    })),
  }
}

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization')

    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'You must be logged in to import material.' }, { status: 401 })
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Supabase is not configured yet.' }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: authorization,
          },
        },
      }
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Your session expired. Please log in again.' }, { status: 401 })
    }

    const body = await request.json()
    const material = typeof body.material === 'string' ? body.material.trim() : ''
    const subject = typeof body.subject === 'string' && body.subject.trim() ? body.subject.trim() : 'General'

    if (material.length < 80) {
      return NextResponse.json({ error: 'Paste more material before importing.' }, { status: 400 })
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(createFallbackImport(material))
    }

    const client = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const completion = await client.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      messages: [
        {
          role: 'system',
          content:
            'You convert pasted study material into structured notes and flashcards. Return only valid JSON.',
        },
        {
          role: 'user',
          content: `Subject: ${subject}

Material:
${material}

Return only JSON with this exact shape:
{
  "title": "short study note title",
  "note": "structured study note with concise headings and bullet points",
  "flashcards": [
    { "front": "direct question?", "back": "short answer" }
  ]
}

Rules:
- Make the note clear and useful for revision.
- Keep the note shorter than the pasted material.
- Create 5-8 flashcards.
- Flashcard fronts must be direct questions ending with question marks.
- Do not include markdown fences or commentary.`,
        },
      ],
      max_tokens: 1400,
    })

    const reply = completion.choices[0]?.message?.content?.trim()
    if (!reply) throw new Error('Empty import response.')

    return NextResponse.json(parseImportPayload(reply))
  } catch (error) {
    console.error('Import material error:', error)
    return NextResponse.json(
      { error: 'We could not import this material right now. Please try again.' },
      { status: 500 }
    )
  }
}
