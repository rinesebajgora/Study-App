import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type SourceSection = { sourceName: string; pageNumber: number | null; content: string }

function splitIntoSections(material: string): SourceSection[] {
  const marker = /\[\[SOURCE:\s*([^\]|]+?)(?:\s*\|\s*PAGE:\s*(\d+))?\s*\]\]/g
  const matches = [...material.matchAll(marker)]
  if (matches.length === 0) return [{ sourceName: 'Pasted material', pageNumber: null, content: material }]

  return matches.map((match, index) => ({
    sourceName: match[1].trim() || 'Imported document',
    pageNumber: match[2] ? Number(match[2]) : null,
    content: material.slice((match.index ?? 0) + match[0].length, matches[index + 1]?.index ?? material.length).trim(),
  })).filter((section) => section.content.length > 0)
}

function chunkText(text: string, size = 900, overlap = 140) {
  const chunks: string[] = []
  for (let start = 0; start < text.length; start += size - overlap) {
    const chunk = text.slice(start, start + size).trim()
    if (chunk) chunks.push(chunk)
  }
  return chunks
}

export async function POST(request: NextRequest) {
  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) return NextResponse.json({ error: 'You must be logged in to save documents.' }, { status: 401 })
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return NextResponse.json({ error: 'Supabase is not configured yet.' }, { status: 500 })

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { global: { headers: { Authorization: authorization } } })
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Your session expired. Please log in again.' }, { status: 401 })

  const body = await request.json()
  const material = typeof body.material === 'string' ? body.material.trim() : ''
  const subject = typeof body.subject === 'string' && body.subject.trim() ? body.subject.trim() : 'General'
  if (material.length < 80) return NextResponse.json({ error: 'Document content is too short to index.' }, { status: 400 })

  const rows = splitIntoSections(material).flatMap((section) => chunkText(section.content).map((content, chunkIndex) => ({
    user_id: user.id, subject, source_name: section.sourceName, page_number: section.pageNumber, chunk_index: chunkIndex, content,
  })))
  const { error } = await supabase.from('document_chunks').insert(rows)
  if (error) return NextResponse.json({ error: error.code === 'PGRST205' ? 'Document search is not set up. Run the updated docs/supabase-schema.sql file.' : error.message }, { status: 500 })
  return NextResponse.json({ chunks: rows.length })
}
