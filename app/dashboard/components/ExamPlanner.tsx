'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { ExamPlan } from '../types'
import EmptyState from './EmptyState'

export type DraftExamPlan = {
  subject: string
  examDate: string
  goal: string
  plan: string
}

type ExamPlannerProps = {
  plans: ExamPlan[]
  draftPlan: DraftExamPlan | null
  subject: string
  examDate: string
  goal: string
  generating: boolean
  saving: boolean
  focusedPlanId: string | null
  subjectOptions: string[]
  todayIso: string
  onSubjectChange: (value: string) => void
  onExamDateChange: (value: string) => void
  onGoalChange: (value: string) => void
  onCreatePlan: (event: FormEvent<HTMLFormElement>) => void
  onUseSamplePlan: () => void
  onSaveDraft: () => void
  onDiscardDraft: () => void
  onDeletePlan: (id: string) => void
  onOpenImport: () => void
}

type PlanTask = {
  id: string
  text: string
  date: string
}

type CompletedTasks = Record<string, string[]>

function cleanTaskLine(line: string) {
  return line
    .replace(/^[-*]\s*/, '')
    .replace(/^\d+[\).:-]\s*/, '')
    .replace(/^day\s+\d+\s*[:.-]\s*/i, '')
    .replace(/^task\s*:\s*/i, '')
    .trim()
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function addDays(date: Date, days: number) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

function getPlanTasks(plan: ExamPlan, todayIso: string): PlanTask[] {
  const startDate = new Date(`${todayIso}T00:00:00`)
  const examDate = new Date(`${plan.examDate}T00:00:00`)
  const totalDays = Math.max(
    Math.ceil((examDate.getTime() - startDate.getTime()) / 86400000),
    1
  )
  const lines = plan.plan.replaceAll('\r\n', '\n').split('\n')
  const dayTasks: Array<{ dayIndex: number; text: string }> = []
  let activeDay = 0

  for (const line of lines) {
    const trimmed = line.trim()
    const dayMatch = trimmed.match(/^day\s+(\d+)\s*[:.-]?/i)

    if (dayMatch) {
      activeDay = Math.min(Math.max(Number(dayMatch[1]) - 1, 0), totalDays - 1)
      continue
    }

    const cleaned = cleanTaskLine(trimmed)
    const isTaskLine = /^[-*]\s*/.test(trimmed) || /^task\s*:/i.test(trimmed)
    const isHeading = /^(overview|daily|practice|revision|checkpoint|exam day|day before|plan|goal)s?\b/i.test(cleaned)

    if (!cleaned || cleaned.length < 8 || isHeading) continue
    if (!isTaskLine && !trimmed.includes(':')) continue

    dayTasks.push({
      dayIndex: activeDay,
      text: cleaned,
    })
  }

  const fallbackTasks =
    dayTasks.length > 0
      ? dayTasks
      : plan.plan
          .split(/(?<=[.!?])\s+/)
          .map(cleanTaskLine)
          .filter((line) => line.length > 25)
          .slice(0, totalDays * 2)
          .map((text, index) => ({
            dayIndex: Math.min(Math.floor(index / 2), totalDays - 1),
            text,
          }))

  const seen = new Set<string>()
  const uniqueTasks = fallbackTasks.filter((task) => {
    const key = task.text.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return uniqueTasks.map((task, index) => ({
    id: `${plan.id}-${index}-${task.text.slice(0, 24).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    text: task.text,
    date: toIsoDate(addDays(startDate, Math.min(task.dayIndex, totalDays - 1))),
  }))
}

export default function ExamPlanner({
  plans,
  draftPlan,
  subject,
  examDate,
  goal,
  generating,
  saving,
  focusedPlanId,
  subjectOptions,
  todayIso,
  onSubjectChange,
  onExamDateChange,
  onGoalChange,
  onCreatePlan,
  onUseSamplePlan,
  onSaveDraft,
  onDiscardDraft,
  onDeletePlan,
  onOpenImport,
}: ExamPlannerProps) {
  const [openPlanIds, setOpenPlanIds] = useState<string[]>([])
  const [completedTasks, setCompletedTasks] = useState<CompletedTasks>(() => {
    if (typeof window === 'undefined') return {}

    try {
      const saved = window.localStorage.getItem('studymate-exam-task-progress')
      return saved ? (JSON.parse(saved) as CompletedTasks) : {}
    } catch {
      return {}
    }
  })
  const taskMap = useMemo(
    () =>
      plans.reduce<Record<string, PlanTask[]>>((acc, plan) => {
        acc[plan.id] = getPlanTasks(plan, todayIso)
        return acc
      }, {}),
    [plans, todayIso]
  )

  useEffect(() => {
    window.localStorage.setItem('studymate-exam-task-progress', JSON.stringify(completedTasks))
  }, [completedTasks])

  useEffect(() => {
    if (!focusedPlanId) return
    const focusTimer = window.setTimeout(() => {
      setOpenPlanIds((prev) => (prev.includes(focusedPlanId) ? prev : [focusedPlanId, ...prev]))
      document.querySelector(`[data-exam-plan-id="${focusedPlanId}"]`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 0)

    return () => window.clearTimeout(focusTimer)
  }, [focusedPlanId])

  const toggleOpenPlan = (id: string) => {
    setOpenPlanIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [id, ...prev]))
  }

  const toggleTaskDone = (planId: string, taskId: string) => {
    setCompletedTasks((prev) => {
      const current = prev[planId] ?? []
      const next = current.includes(taskId)
        ? current.filter((id) => id !== taskId)
        : [...current, taskId]

      return {
        ...prev,
        [planId]: next,
      }
    })
  }

  const toDayNumber = (isoDate: string) => {
    const [year, month, day] = isoDate.slice(0, 10).split('-').map(Number)
    return Math.floor(Date.UTC(year, month - 1, day) / 86400000)
  }

  const todayDay = toDayNumber(todayIso)

  const getExamMeta = (plan: ExamPlan) => {
    const examDay = toDayNumber(plan.examDate)
    const createdDay = plan.createdAt ? toDayNumber(plan.createdAt) : todayDay
    const daysLeft = examDay - todayDay
    const totalDays = Math.max(examDay - createdDay, 1)
    const elapsedDays = Math.min(Math.max(todayDay - createdDay, 0), totalDays)
    const progress = daysLeft < 0 ? 100 : Math.round((elapsedDays / totalDays) * 100)

    if (daysLeft < 0) {
      return {
        status: 'Completed',
        label: `${Math.abs(daysLeft)} days ago`,
        progress: 100,
        tone: 'bg-stone-100 text-stone-600',
        bar: 'bg-stone-400',
      }
    }

    if (daysLeft === 0) {
      return {
        status: 'Today',
        label: 'Exam is today',
        progress: 100,
        tone: 'bg-orange-100 text-orange-700',
        bar: 'bg-orange-500',
      }
    }

    return {
      status: 'Upcoming',
      label: `${daysLeft} days left`,
      progress,
      tone: daysLeft <= 7 ? 'bg-orange-100 text-orange-700' : 'bg-teal-50 text-teal-800',
      bar: daysLeft <= 7 ? 'bg-orange-500' : 'bg-teal-700',
    }
  }

  const sortedPlans = [...plans].sort((a, b) => {
    const aPast = a.examDate < todayIso
    const bPast = b.examDate < todayIso
    if (aPast !== bPast) return aPast ? 1 : -1
    return a.examDate.localeCompare(b.examDate)
  })
  const upcomingCount = plans.filter((plan) => plan.examDate >= todayIso).length
  const completedCount = plans.length - upcomingCount

  return (
    <section className="surface-panel rounded-3xl border border-stone-200/80 bg-white/96 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Exam planner</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Create a focused plan from an exam date, goal, and subject. AI helps generate the routine, but the plan stays attached to your workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenImport}
            className="app-button min-h-10 border border-stone-200 bg-white px-4 text-sm text-stone-700 hover:bg-stone-50"
          >
            Import files
          </button>
          <span className="rounded-full bg-teal-50 px-4 py-2 text-xs font-semibold text-teal-800">
            {upcomingCount} upcoming
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {[
          ['Upcoming', upcomingCount],
          ['Completed', completedCount],
          ['Total plans', plans.length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              {label}
            </p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <form onSubmit={onCreatePlan} className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,0.8fr)_11rem_minmax(0,1fr)_auto]">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">Subject</span>
          <input
            value={subject ?? ''}
            list="exam-plan-subjects"
            onChange={(event) => onSubjectChange(event.target.value)}
            placeholder="Biology"
            className="h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-slate-900 outline-none transition focus:border-teal-700"
            disabled={generating}
            required
          />
          <datalist id="exam-plan-subjects">
            {subjectOptions.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">Exam date</span>
          <input
            type="date"
            value={examDate ?? ''}
            onChange={(event) => onExamDateChange(event.target.value)}
            className="h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-slate-900 outline-none transition focus:border-teal-700"
            disabled={generating}
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">Goal</span>
          <input
            value={goal ?? ''}
            onChange={(event) => onGoalChange(event.target.value)}
            placeholder="Finish all chapters and practice past questions"
            className="h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-slate-900 outline-none transition focus:border-teal-700"
            disabled={generating}
          />
        </label>

        <button
          type="submit"
          disabled={generating || !subject.trim() || !examDate}
          className="app-button self-end bg-teal-900 text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {generating ? 'Planning...' : 'Create plan'}
        </button>
      </form>

      {draftPlan && (
        <article className="mt-6 rounded-3xl border border-teal-200 bg-teal-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">
                Draft plan
              </p>
              <h3 className="mt-2 text-lg font-semibold">
                {draftPlan.subject} exam on {draftPlan.examDate}
              </h3>
              {draftPlan.goal && <p className="mt-2 text-sm leading-6 text-stone-600">{draftPlan.goal}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onSaveDraft}
                disabled={saving}
                className="app-button min-h-10 bg-teal-900 px-3 text-xs text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={onDiscardDraft}
                disabled={saving}
                className="app-button min-h-10 border border-stone-200 bg-white px-3 text-xs text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Discard
              </button>
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-white p-4">
            <p className="text-sm font-semibold text-slate-800">Generated plan</p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{draftPlan.plan}</p>
          </div>
        </article>
      )}

      <div className="mt-6 space-y-3">
        {plans.length === 0 ? (
          <EmptyState
            title="No exam plans yet."
            description="Generate a draft, then save it here when it looks right."
            actions={[{ label: 'Fill sample plan', onClick: onUseSamplePlan }]}
          />
        ) : (
          sortedPlans.map((plan) => {
            const meta = getExamMeta(plan)
            const open = openPlanIds.includes(plan.id)
            const tasks = taskMap[plan.id] ?? []
            const doneTaskIds = completedTasks[plan.id] ?? []
            const taskProgress = tasks.length === 0 ? 0 : Math.round((doneTaskIds.length / tasks.length) * 100)
            const timelineGroups = Array.from(new Set(tasks.map((task) => task.date))).map((date) => ({
              date,
              tasks: tasks.filter((task) => task.date === date),
            }))

            return (
            <article
              key={plan.id}
              data-exam-plan-id={plan.id}
              className="rounded-3xl border border-stone-200 bg-stone-50 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">
                    {plan.subject}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold">Exam on {plan.examDate}</h3>
                  {plan.goal && <p className="mt-2 text-sm leading-6 text-stone-600">{plan.goal}</p>}
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <span className={`inline-flex min-h-10 items-center rounded-2xl px-3 text-xs font-semibold ${meta.tone}`}>
                    {meta.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleOpenPlan(plan.id)}
                    className="app-button min-h-10 border border-stone-200 bg-white px-3 text-xs text-stone-700 hover:bg-stone-50"
                  >
                    {open ? 'Hide plan' : 'View plan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeletePlan(plan.id)}
                    className="app-button min-h-10 bg-red-600 px-3 text-xs text-white hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-3 lg:grid-cols-2">
              <div className="rounded-2xl border border-stone-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Time progress</p>
                    <p className="mt-1 text-sm text-stone-600">{meta.label}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-800">{meta.progress}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
                  <div
                    className={`h-full rounded-full ${meta.bar}`}
                    style={{ width: `${meta.progress}%` }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Task progress</p>
                    <p className="mt-1 text-sm text-stone-600">
                      {doneTaskIds.length}/{tasks.length} tasks done
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-slate-800">{taskProgress}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-full rounded-full bg-teal-700"
                    style={{ width: `${taskProgress}%` }}
                  />
                </div>
              </div>
              </div>

              {open && (
                <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.85fr)]">
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-sm font-semibold text-slate-800">Daily checklist</p>
                    <div className="mt-3 space-y-2">
                      {tasks.length === 0 ? (
                        <p className="text-sm leading-6 text-stone-600">
                          No tasks could be extracted from this plan yet.
                        </p>
                      ) : (
                        tasks.map((task) => {
                          const done = doneTaskIds.includes(task.id)

                          return (
                            <label
                              key={task.id}
                              className={`flex gap-3 rounded-2xl border p-3 text-sm leading-6 ${
                                done ? 'border-teal-200 bg-teal-50 text-stone-600' : 'border-stone-200 bg-stone-50 text-slate-800'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={done}
                                onChange={() => toggleTaskDone(plan.id, task.id)}
                                className="mt-1 h-4 w-4 accent-teal-800"
                              />
                              <span className={done ? 'line-through' : ''}>{task.text}</span>
                            </label>
                          )
                        })
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-sm font-semibold text-slate-800">Exam timeline</p>
                    <div className="mt-3 space-y-3">
                      {timelineGroups.map((group) => (
                        <div key={group.date} className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-800">
                            {group.date}
                          </p>
                          <ul className="mt-2 space-y-2 text-sm leading-6 text-stone-700">
                            {group.tasks.map((task) => (
                              <li key={task.id}>
                                {doneTaskIds.includes(task.id) ? 'Done: ' : ''}
                                {task.text}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                      <div className="rounded-2xl border border-orange-200 bg-orange-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-700">
                          Exam day
                        </p>
                        <p className="mt-2 text-sm leading-6 text-orange-800">{plan.examDate}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </article>
            )
          })
        )}
      </div>
    </section>
  )
}

