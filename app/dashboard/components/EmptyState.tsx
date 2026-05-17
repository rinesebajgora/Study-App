'use client'

type EmptyStateAction = {
  label: string
  onClick: () => void
}

type EmptyStateProps = {
  title: string
  description: string
  actions?: EmptyStateAction[]
}

export default function EmptyState({ title, description, actions = [] }: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 px-5 py-8 text-center text-stone-600">
      <p className="font-medium text-slate-800">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6">{description}</p>
      {actions.length > 0 && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className="app-button min-h-10 bg-teal-900 px-3 text-xs text-white hover:bg-teal-800"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
