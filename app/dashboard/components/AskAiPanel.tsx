'use client'

import { FormEvent } from 'react'
import { PromptSuggestion, StatusMessage } from '../types'

type AskAiPanelProps = {
  input: string
  subject: string
  aiResponse: string
  loading: boolean
  tempDelete: boolean
  status: StatusMessage | null
  draftLabel: string
  promptSuggestions: PromptSuggestion[]
  subjectOptions: string[]
  onInputChange: (value: string) => void
  onSubjectChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onStatusClear: () => void
  onRegenerate: () => void
  onSave: () => void
  onDiscard: () => void
}

export default function AskAiPanel({
  input,
  subject,
  aiResponse,
  loading,
  tempDelete,
  status,
  draftLabel,
  promptSuggestions,
  subjectOptions,
  onInputChange,
  onSubjectChange,
  onSubmit,
  onStatusClear,
  onRegenerate,
  onSave,
  onDiscard,
}: AskAiPanelProps) {
  return (
    <section className="surface-panel rounded-3xl border border-stone-200/80 bg-white/96 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">AI study helper</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Ask for explanations, examples, summaries, or practice questions, then save only what is useful.
          </p>
        </div>
        <div
          className={`inline-flex min-h-10 items-center rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${
            loading
              ? 'bg-orange-500/20 text-orange-700'
              : aiResponse
                ? 'bg-teal-500/18 text-teal-700'
                : 'bg-stone-100 text-stone-500'
          }`}
        >
          {draftLabel}
        </div>
      </div>

      {loading && (
        <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
          Generating a study answer. This can take a few seconds.
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <span className="mb-2 block text-sm font-medium text-stone-700">Quick prompts</span>
          <div className="flex flex-wrap gap-2">
            {promptSuggestions.map((prompt) => (
              <button
                type="button"
                key={prompt.subject}
                onClick={() => {
                  onSubjectChange(prompt.subject)
                  onInputChange(prompt.question)
                  onStatusClear()
                }}
                disabled={loading}
                className="app-button min-h-10 border border-stone-200 bg-white px-3 text-xs text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {prompt.subject}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">Question</span>
          <textarea
            value={input ?? ''}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder="Explain the difference between mitosis and meiosis with an easy memory trick."
            className="min-h-52 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-stone-400 focus:border-teal-700"
            disabled={loading}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">Subject</span>
          <input
            type="text"
            value={subject ?? ''}
            list="ask-ai-subjects"
            onChange={(event) => onSubjectChange(event.target.value)}
            placeholder="Biology, algebra, history..."
            className="h-13 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-slate-900 outline-none transition placeholder:text-stone-400 focus:border-teal-700"
            disabled={loading}
          />
          <datalist id="ask-ai-subjects">
            {subjectOptions.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </label>

        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="app-button min-h-13 w-full justify-center bg-teal-900 text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-44"
        >
          {loading ? 'Thinking...' : 'Generate answer'}
        </button>
      </form>

      {status && (
        <div
          className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-medium ${
            status.type === 'success'
              ? 'border-teal-200 bg-teal-50 text-teal-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {status.text}
        </div>
      )}

      {aiResponse && tempDelete && (
        <div className="mt-6 rounded-3xl border border-teal-200 bg-teal-50/80 p-5 sm:p-6">
          <p className="text-sm font-semibold">Generated answer</p>
          <p className="mt-1 text-sm text-stone-600">
            Save it if you want it in your long-term study history.
          </p>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7">{aiResponse}</p>
          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <button
              onClick={onRegenerate}
              disabled={loading}
              className="app-button min-w-36 border border-teal-200 bg-white text-teal-800 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Regenerate
            </button>
            <button
              onClick={onSave}
              disabled={loading}
              className="app-button min-w-36 bg-teal-800 text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save answer
            </button>
            <button
              onClick={onDiscard}
              disabled={loading}
              className="app-button min-w-34 border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
