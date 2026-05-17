'use client'

import { StatusMessage } from '../types'

type ToastProps = {
  status: StatusMessage | null
  onClose: () => void
}

export default function Toast({ status, onClose }: ToastProps) {
  if (!status) return null

  const success = status.type === 'success'

  return (
    <div className="fixed right-4 top-4 z-50 w-[min(24rem,calc(100vw-2rem))]">
      <div
        className={`rounded-3xl border px-4 py-3 shadow-xl ${
          success
            ? 'border-teal-200 bg-white text-teal-900'
            : 'border-red-200 bg-white text-red-800'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em]">
              {success ? 'Success' : 'Needs attention'}
            </p>
            <p className="mt-1 text-sm leading-6">{status.text}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="app-button min-h-8 border border-stone-200 bg-white px-2 text-xs text-stone-600 hover:bg-stone-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
