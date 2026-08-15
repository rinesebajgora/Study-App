'use client'

import { ChangeEvent, DragEvent, useRef, useState } from 'react'
import mammoth from 'mammoth'
import type { TextItem } from 'pdfjs-dist/types/src/display/api'

type ImportPreview = {
  title: string
  note: string
  flashcards: Array<{ front: string; back: string }>
}

type ImportMaterialProps = {
  material: string
  fileMaterial: string
  subject: string
  preview: ImportPreview | null
  importing: boolean
  saving: boolean
  subjectOptions: string[]
  onMaterialChange: (value: string) => void
  onFileMaterialChange: (value: string) => void
  onSubjectChange: (value: string) => void
  onImport: () => void
  onSave: () => void
  onDiscard: () => void
}

export default function ImportMaterial({
  material,
  fileMaterial,
  subject,
  preview,
  importing,
  saving,
  subjectOptions,
  onMaterialChange,
  onFileMaterialChange,
  onSubjectChange,
  onImport,
  onSave,
  onDiscard,
}: ImportMaterialProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [fileMessage, setFileMessage] = useState<string | null>(null)
  const [draggingFiles, setDraggingFiles] = useState(false)

  const readableFileTypes = new Set([
    'csv',
    'html',
    'htm',
    'json',
    'log',
    'md',
    'rtf',
    'text',
    'txt',
    'xml',
    'yaml',
    'yml',
  ])

  const extractFileText = async (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? ''

    if (extension === 'pdf') {
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.mjs',
        import.meta.url
      ).toString()
      const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise
      const pages: string[] = []

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber)
        const content = await page.getTextContent()
        const pageText = content.items
          .filter((item): item is TextItem => 'str' in item)
          .map((item) => item.str)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()

        if (pageText) pages.push(`[[SOURCE: ${file.name} | PAGE: ${pageNumber}]]\n${pageText}`)
      }

      return pages.join('\n\n').trim()
    }

    if (extension === 'docx') {
      const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
      return `[[SOURCE: ${file.name}]]\n${result.value.trim()}`
    }

    const canReadAsText = file.type.startsWith('text/') || readableFileTypes.has(extension)
    if (!canReadAsText) return null

    return `[[SOURCE: ${file.name}]]\n${(await file.text()).trim()}`
  }

  const importFiles = async (files: File[]) => {
    const selectedFiles = files
    if (selectedFiles.length === 0) return

    const importedSections: string[] = []
    const skippedFiles: string[] = []

    for (const file of selectedFiles) {
      try {
        const text = await extractFileText(file)
        if (!text) {
          skippedFiles.push(file.name)
          continue
        }

        importedSections.push(text)
      } catch {
        skippedFiles.push(file.name)
      }
    }

    if (importedSections.length > 0) {
      onFileMaterialChange([fileMaterial.trim(), ...importedSections].filter(Boolean).join('\n\n---\n\n'))
    }

    if (skippedFiles.length > 0) {
      setFileMessage(`Imported ${importedSections.length} file(s). Skipped unsupported files: ${skippedFiles.join(', ')}.`)
    } else {
      setFileMessage(`Imported ${importedSections.length} file(s).`)
    }
  }

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    await importFiles(Array.from(event.target.files ?? []))
    event.target.value = ''
  }

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDraggingFiles(false)
    await importFiles(Array.from(event.dataTransfer.files ?? []))
  }

  return (
    <section className="surface-panel rounded-3xl border border-stone-200/80 bg-white/96 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Import material</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Paste long notes or lesson material, then review the structured note and flashcards before saving.
          </p>
        </div>
        <span className="rounded-full bg-teal-50 px-4 py-2 text-xs font-semibold text-teal-800">
          Paste import
        </span>
      </div>

      <div
        onDragEnter={(event) => {
          event.preventDefault()
          setDraggingFiles(true)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
          setDraggingFiles(false)
        }}
        onDrop={handleDrop}
        className={`mt-6 rounded-2xl border border-dashed p-4 transition ${
          draggingFiles ? 'border-teal-700 bg-teal-50' : 'border-stone-300 bg-stone-50'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">File import</p>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Drop files here or choose documents. When saved, the text is split into searchable sections so AI answers can cite the document and PDF page.
            </p>
            {fileMessage && <p className="mt-2 text-sm text-teal-800">{fileMessage}</p>}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing || saving}
            className="app-button min-h-10 border border-stone-200 bg-white px-4 text-sm text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Choose files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.md,.csv,.json,.html,.htm,.xml,.rtf,.log,.yaml,.yml,text/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileUpload}
            className="hidden"
            disabled={importing || saving}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">Material</span>
          <textarea
            value={material ?? ''}
            onChange={(event) => onMaterialChange(event.target.value)}
            placeholder="Paste lecture notes, textbook paragraphs, or study material here..."
            className="min-h-72 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-stone-400 focus:border-teal-700"
            disabled={importing || saving}
          />
        </label>

        <div>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-700">Subject</span>
            <input
              value={subject ?? ''}
              list="import-material-subjects"
              onChange={(event) => onSubjectChange(event.target.value)}
              placeholder="Biology, Math..."
              className="h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-slate-900 outline-none transition focus:border-teal-700"
              disabled={importing || saving}
            />
            <datalist id="import-material-subjects">
              {subjectOptions.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </label>

          <button
            type="button"
            onClick={onImport}
            disabled={importing || saving || [material, fileMaterial].join('\n').trim().length < 80}
            className="app-button mt-4 min-h-12 w-full justify-center bg-teal-900 px-4 text-sm text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {importing ? 'Importing...' : 'Generate preview'}
          </button>
        </div>
      </div>

      {preview && (
        <div className="mt-6 rounded-3xl border border-teal-200 bg-teal-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">Import preview</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">{preview.title}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Review the note and cards before saving them to your workspace.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="app-button min-h-10 bg-teal-900 px-4 text-sm text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save import'}
              </button>
              <button
                type="button"
                onClick={onDiscard}
                disabled={saving}
                className="app-button min-h-10 border border-stone-200 bg-white px-4 text-sm text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Discard
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.9fr)]">
            <article className="rounded-2xl bg-white p-4">
              <p className="text-sm font-semibold text-slate-800">Structured study note</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{preview.note}</p>
            </article>

            <article className="rounded-2xl bg-white p-4">
              <p className="text-sm font-semibold text-slate-800">Flashcards</p>
              <div className="mt-3 space-y-3">
                {preview.flashcards.map((card, index) => (
                  <div key={`${card.front}-${index}`} className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-800">
                      Card {index + 1}
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{card.front}</p>
                    <p className="mt-2 text-sm leading-6 text-stone-600">{card.back}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      )}
    </section>
  )
}
