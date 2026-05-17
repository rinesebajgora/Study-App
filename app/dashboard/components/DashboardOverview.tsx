import { ExamPlan, QA } from '../types'

export type ProgressStats = {
  totalNotes: number
  totalSubjects: number
  totalFlashcards: number
  reviewedFlashcards: number
  pinnedNotes: number
  upcomingExams: number
  completedExams: number
  revisionProgress: number
  subjectCoverage: number
  examReadiness: number
}

type DashboardOverviewProps = {
  savedQA: QA[]
  examPlans: ExamPlan[]
  subjects: string[]
  todayIso: string
  pinnedCount: number
  progress: ProgressStats
}

export default function DashboardOverview({
  savedQA,
  examPlans,
  subjects,
  todayIso,
  pinnedCount,
  progress,
}: DashboardOverviewProps) {
  const upcomingExams = examPlans
    .filter((plan) => plan.examDate >= todayIso)
    .sort((a, b) => a.examDate.localeCompare(b.examDate))
  const upcomingExam = upcomingExams[0]
  const overdueCount = examPlans.filter((plan) => plan.examDate < todayIso).length

  const workspacePillars = [
    ['Subjects', `${subjects.length || 0} active`, 'Group notes and plans by class.'],
    ['Exam plans', `${examPlans.length} saved`, 'Turn dates and goals into study routines.'],
    ['Study notes', `${savedQA.length} saved`, 'Keep AI answers and manual notes together.'],
    ['Revision', `${pinnedCount} pinned`, 'Mark important material for focused review.'],
  ]
  const progressCards = [
    ['Revision progress', `${progress.revisionProgress}%`, `${progress.reviewedFlashcards}/${progress.totalFlashcards} flashcards reviewed`, progress.revisionProgress],
    ['Subject coverage', `${progress.subjectCoverage}%`, `${progress.totalSubjects} subjects with saved material`, progress.subjectCoverage],
    ['Exam readiness', `${progress.examReadiness}%`, `${progress.completedExams}/${examPlans.length} plans completed`, progress.examReadiness],
  ]

  return (
    <>
      <section className="glass-panel rounded-3xl border border-stone-200/80 bg-white/82 px-5 py-6 sm:px-7">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-800">
              StudyMate AI workspace
            </p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
              Plan exams, save notes, and revise from one student workspace.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600">
              AI is here for explanations, summaries, and study plans, while the product stays focused on organization, revision, and progress.
            </p>
          </div>

          <div className="rounded-3xl border border-teal-100 bg-teal-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">
              Next priority
            </p>
            <h3 className="mt-3 text-lg font-semibold">
              {upcomingExam ? `${upcomingExam.subject} exam` : 'Create an exam plan'}
            </h3>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              {upcomingExam
                ? `Scheduled for ${upcomingExam.examDate}. Keep your revision tasks close to your saved notes.`
                : 'Add an exam date and goal so StudyMate AI can build the first realistic study routine.'}
            </p>
          </div>
        </div>
      </section>

      <section className="surface-panel rounded-3xl border border-stone-200/80 bg-white/96 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Progress dashboard</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Real-time study progress from notes, flashcards, subjects, and exam plans.
            </p>
          </div>
          <span className="rounded-full bg-teal-50 px-4 py-2 text-xs font-semibold text-teal-800">
            Live stats
          </span>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {progressCards.map(([label, value, description, rawProgress]) => (
            <div key={label as string} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    {label}
                  </p>
                  <p className="mt-3 text-2xl font-semibold leading-7">{value}</p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-stone-600">
                  {rawProgress}%
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-teal-700"
                  style={{ width: `${rawProgress}%` }}
                />
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-600">{description}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {workspacePillars.map(([label, value, description]) => (
            <div key={label} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                {label}
              </p>
              <p className="mt-3 text-lg font-semibold leading-6">{value}</p>
              <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-3xl border border-stone-200 bg-stone-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-800">
                Upcoming exams
              </h3>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Your next deadlines from the exam planner.
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-600">
              {upcomingExams.length} active · {overdueCount} past
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {upcomingExams.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-4 text-sm text-stone-600 md:col-span-3">
                No upcoming exams yet. Create one in the exam planner to make revision visible here.
              </div>
            ) : (
              upcomingExams.slice(0, 3).map((plan) => (
                <div key={plan.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-800">
                    {plan.subject}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">{plan.examDate}</p>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">
                    {plan.goal || 'Revision plan ready'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </>
  )
}
