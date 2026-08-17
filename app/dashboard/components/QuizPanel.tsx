'use client'

import { FormEvent, useMemo, useState } from 'react'
import { QA } from '../types'
import EmptyState from './EmptyState'

export type QuizQuestion = {
  id: string
  type: 'multiple_choice' | 'true_false' | 'open'
  question: string
  options?: string[]
  answer: string
  explanation: string
  topic: string
}

export type GeneratedQuiz = { id: string; questions: QuizQuestion[] }

type QuizPanelProps = {
  notes: QA[]
  subjects: string[]
  generating: boolean
  history: Array<{ id: string; subject: string; title: string; score: number; correctAnswers: number; totalQuestions: number; durationSeconds: number; completedAt: string }>
  weakSubjects: Array<{ subject: string }>
  onGenerate: (params: { material: string; subject: string; title: string; sourceType: 'note' | 'subject' | 'material' }) => Promise<GeneratedQuiz | null>
  onSubmitQuiz: (params: { quizId: string; questions: QuizQuestion[]; answers: Record<string, string>; startedAt: number }) => Promise<boolean>
}

export default function QuizPanel({ notes, subjects, generating, history, weakSubjects, onGenerate, onSubmitQuiz }: QuizPanelProps) {
  const [source, setSource] = useState<'note' | 'subject' | 'material'>('note')
  const [noteId, setNoteId] = useState('')
  const [subject, setSubject] = useState('')
  const [material, setMaterial] = useState('')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [quizId, setQuizId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [savingAttempt, setSavingAttempt] = useState(false)
  const selectedNote = notes.find((note) => note.id === noteId)
  const subjectNotes = useMemo(() => notes.filter((note) => (note.subject || 'General') === subject), [notes, subject])
  const score = questions.reduce((total, question) => total + (answers[question.id]?.trim().toLowerCase() === question.answer.trim().toLowerCase() ? 1 : 0), 0)

  const generate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    let payload: { material: string; subject: string; title: string; sourceType: 'note' | 'subject' | 'material' } | null = null
    if (source === 'note' && selectedNote) {
      payload = { material: `${selectedNote.question}\n\n${selectedNote.answer}`, subject: selectedNote.subject || 'General', title: selectedNote.question, sourceType: 'note' }
    } else if (source === 'subject' && subjectNotes.length) {
      payload = { material: subjectNotes.map((note) => `Title: ${note.question}\n${note.answer}`).join('\n\n---\n\n'), subject, title: `${subject} study notes`, sourceType: 'subject' }
    } else if (source === 'material' && material.trim().length >= 80) {
      payload = { material: material.trim(), subject: subject.trim() || 'General', title: 'Pasted study material', sourceType: 'material' }
    }
    if (!payload) return
    const generated = await onGenerate(payload)
    if (generated) {
      setQuestions(generated.questions)
      setQuizId(generated.id)
      setAnswers({})
      setSubmitted(false)
      setStartedAt(Date.now())
    }
  }

  const submitQuiz = async () => {
    if (!quizId || !startedAt || savingAttempt) return
    setSavingAttempt(true)
    const saved = await onSubmitQuiz({ quizId, questions, answers, startedAt })
    if (saved) setSubmitted(true)
    setSavingAttempt(false)
  }

  return (
    <section className="surface-panel rounded-3xl border border-stone-200/80 bg-white/96 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">AI assessment</p>
          <h2 className="mt-2 text-xl font-semibold">Quiz generator</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">Create multiple-choice, true/false, and open questions from a saved note, a subject, or pasted/imported material.</p>
        </div>
        {questions.length > 0 && <span className="rounded-full bg-teal-50 px-4 py-2 text-xs font-semibold text-teal-800">{questions.length} questions</span>}
      </div>

      <form onSubmit={generate} className="mt-6 rounded-3xl border border-stone-200 bg-stone-50 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {([['note', 'Saved note'], ['subject', 'Subject'], ['material', 'Pasted material']] as const).map(([value, label]) => (
            <label key={value} className={`cursor-pointer rounded-2xl border p-3 text-sm font-semibold ${source === value ? 'border-teal-700 bg-teal-50 text-teal-900' : 'border-stone-200 bg-white text-stone-700'}`}>
              <input className="sr-only" type="radio" checked={source === value} onChange={() => setSource(value)} />{label}
            </label>
          ))}
        </div>
        {source === 'note' && (
          <label className="mt-4 block"><span className="mb-2 block text-sm font-medium text-stone-700">Choose a saved note</span><select value={noteId} onChange={(event) => setNoteId(event.target.value)} className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-3 text-slate-900 outline-none focus:border-teal-700"><option value="">Select a note...</option>{notes.map((note) => <option key={note.id} value={note.id}>{note.subject || 'General'} — {note.question}</option>)}</select></label>
        )}
        {source === 'subject' && (
          <label className="mt-4 block"><span className="mb-2 block text-sm font-medium text-stone-700">Choose a subject</span><select value={subject} onChange={(event) => setSubject(event.target.value)} className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-3 text-slate-900 outline-none focus:border-teal-700"><option value="">Select a subject...</option>{subjects.map((item) => <option key={item} value={item}>{item}</option>)}</select>{subject && <span className="mt-2 block text-xs text-stone-500">{subjectNotes.length} saved note(s) will be used.</span>}</label>
        )}
        {source === 'material' && (
          <div className="mt-4 space-y-3"><input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Subject (optional)" className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-3 text-slate-900 outline-none focus:border-teal-700" /><textarea value={material} onChange={(event) => setMaterial(event.target.value)} placeholder="Paste material from a lecture or imported document..." className="min-h-44 w-full rounded-2xl border border-stone-200 bg-white px-3 py-3 text-slate-900 outline-none focus:border-teal-700" /></div>
        )}
        <button type="submit" disabled={generating || (source === 'note' && !selectedNote) || (source === 'subject' && subjectNotes.length === 0) || (source === 'material' && material.trim().length < 80)} className="app-button mt-4 min-h-12 bg-teal-900 px-4 text-sm text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60">{generating ? 'Generating quiz...' : 'Generate quiz'}</button>
      </form>

      {questions.length === 0 ? <div className="mt-6"><EmptyState title="No quiz generated yet." description="Choose a source above and create a quiz from your own study material." /></div> : (
        <div className="mt-6 space-y-4">
          {submitted && <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4"><p className="text-lg font-semibold text-teal-900">Score: {score}/{questions.length}</p><p className="mt-1 text-sm text-teal-800">Your result and question-level analysis have been saved. Review each explanation below.</p></div>}
          {questions.map((question, index) => {
            const isOpen = question.type === 'open'
            const correct = submitted && answers[question.id]?.trim().toLowerCase() === question.answer.trim().toLowerCase()
            return <article key={question.id} className="rounded-3xl border border-stone-200 bg-stone-50 p-5"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-slate-900">{index + 1}. {question.question}</p><span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500">{question.type.replace('_', ' ')}</span></div><p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-teal-800">Topic: {question.topic}</p>{isOpen ? <textarea value={answers[question.id] ?? ''} disabled={submitted} onChange={(event) => setAnswers((prev) => ({ ...prev, [question.id]: event.target.value }))} placeholder="Write your answer..." className="mt-4 min-h-24 w-full rounded-2xl border border-stone-200 bg-white px-3 py-3 text-sm outline-none focus:border-teal-700 disabled:bg-stone-100" /> : <div className="mt-4 grid gap-2">{(question.options ?? []).map((option) => <label key={option} className={`cursor-pointer rounded-2xl border bg-white p-3 text-sm ${answers[question.id] === option ? 'border-teal-700' : 'border-stone-200'} ${submitted ? 'cursor-default opacity-80' : ''}`}><input type="radio" className="mr-2 accent-teal-800" name={question.id} value={option} checked={answers[question.id] === option} disabled={submitted} onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: option }))} />{option}</label>)}</div>}{submitted && <div className={`mt-4 rounded-2xl border p-3 text-sm ${correct ? 'border-teal-200 bg-teal-50 text-teal-900' : 'border-orange-200 bg-orange-50 text-orange-900'}`}><p className="font-semibold">{correct ? 'Correct' : `Correct answer: ${question.answer}`}</p><p className="mt-1 leading-6">{question.explanation}</p></div>}</article>
          })}
          {!submitted ? <button type="button" onClick={submitQuiz} disabled={savingAttempt || questions.some((question) => !answers[question.id]?.trim())} className="app-button min-h-12 bg-teal-900 px-4 text-sm text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60">{savingAttempt ? 'Saving result...' : 'Submit quiz'}</button> : <button type="button" onClick={() => { setAnswers({}); setSubmitted(false); setStartedAt(Date.now()) }} className="app-button min-h-12 border border-stone-200 bg-white px-4 text-sm text-stone-700 hover:bg-stone-50">Try again</button>}
        </div>
      )}

      <section className="mt-8 grid gap-4 xl:grid-cols-2">
        <article className="rounded-3xl border border-stone-200 bg-stone-50 p-5"><h3 className="text-lg font-semibold">Quiz history</h3><div className="mt-4 space-y-3">{history.length === 0 ? <p className="text-sm leading-6 text-stone-600">Complete a quiz to see your saved results here.</p> : history.slice(0, 5).map((item) => <div key={item.id} className="rounded-2xl bg-white p-3"><p className="text-sm font-semibold text-slate-900">{item.subject} — {item.score}%</p><p className="mt-1 text-xs leading-5 text-stone-600">{item.correctAnswers}/{item.totalQuestions} correct · {Math.max(1, Math.round(item.durationSeconds / 60))} min · {new Date(item.completedAt).toLocaleDateString()}</p></div>)}</div></article>
        <article className="rounded-3xl border border-stone-200 bg-stone-50 p-5"><h3 className="text-lg font-semibold">Subjects to review</h3><div className="mt-4 space-y-3">{weakSubjects.length === 0 ? <p className="text-sm leading-6 text-stone-600">No subjects need review yet. Subjects with missed quiz answers will appear here.</p> : weakSubjects.map((item) => <div key={item.subject} className="rounded-2xl bg-white p-3"><p className="text-sm font-semibold text-slate-900">{item.subject}</p></div>)}</div></article>
      </section>
    </section>
  )
}
