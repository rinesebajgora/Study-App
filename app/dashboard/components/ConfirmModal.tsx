'use client'

type ConfirmModalProps = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  loading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 px-4 py-6 sm:items-center">
      <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-5 text-slate-900 shadow-2xl">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600">Confirm action</p>
          <h2 className="mt-2 text-xl font-semibold">{title}</h2>
        </div>

        <p className="mt-4 text-sm leading-6 text-stone-600">{description}</p>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="app-button min-h-10 border border-stone-200 bg-white px-4 text-sm text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="app-button min-h-10 bg-red-600 px-4 text-sm text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
