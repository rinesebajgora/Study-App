import { ExamPlan } from '../types'
import type { GamificationProfile } from '../../lib/gamification'
import GamificationPanel from './GamificationPanel'

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

export type DashboardAnalytics = {
  studyStreak: number
  reviewedToday: number
  knowledgeProfiles: Array<{
    name: string
    score: number
    quizScore: number | null
    flashcardScore: number | null
    quizQuestions: number
    flashcards: number
    recommendation: string
  }>
  topicProfiles: Array<{ name: string; score: number; quizQuestions: number; recommendation: string }>
  dailyRecommendation: {
    subject: string | null
    reason: string
    flashcardCount: number
    dueFlashcards: number
    quizLabel: string
    examLabel: string | null
  }
  upcomingDeadlines: number
  gamification: GamificationProfile
}

type DashboardOverviewProps = {
  examPlans: ExamPlan[]
  todayIso: string
  progress: ProgressStats
  analytics: DashboardAnalytics
}

export default function DashboardOverview({
  examPlans,
  todayIso,
  progress,
  analytics,
}: DashboardOverviewProps) {
  const upcomingExams = examPlans
    .filter((plan) => plan.examDate >= todayIso)
    .sort((a, b) => a.examDate.localeCompare(b.examDate))
  const overdueCount = examPlans.filter((plan) => plan.examDate < todayIso).length

  const progressCards = [
    ['Revision progress', `${progress.revisionProgress}%`, `${progress.reviewedFlashcards}/${progress.totalFlashcards} flashcards reviewed`, progress.revisionProgress],
    ['Subject coverage', `${progress.subjectCoverage}%`, `${progress.totalSubjects} subjects with saved material`, progress.subjectCoverage],
    ['Exam readiness', `${progress.examReadiness}%`, `${progress.completedExams}/${examPlans.length} plans completed`, progress.examReadiness],
  ]
  const analyticsCards = [
    ['Study streak', `${analytics.studyStreak} day${analytics.studyStreak === 1 ? '' : 's'}`, 'Consecutive days with reviewed flashcards.'],
    ['Cards reviewed today', `${analytics.reviewedToday}`, 'Cards with review activity today.'],
    ['Upcoming deadlines', `${analytics.upcomingDeadlines}`, 'Exam plans due in the next 14 days.'],
  ]
  const daily = analytics.dailyRecommendation

  return (
    <>
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

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {analyticsCards.map(([label, value, description]) => (
            <div key={label} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                {label}
              </p>
              <p className="mt-3 text-2xl font-semibold leading-7">{value}</p>
              <p className="mt-3 text-sm leading-6 text-stone-600">{description}</p>
            </div>
          ))}
        </div>

        <section className="mt-5" aria-label="Exam readiness">
          <div className="rounded-3xl border border-teal-200 bg-teal-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">Exam readiness indicator</p>
            <div className="mt-4 flex items-end gap-4"><p className="text-5xl font-semibold text-slate-900">{progress.examReadiness}%</p><p className="pb-1 text-sm text-stone-600">{progress.examReadiness >= 75 ? 'Strong foundation' : progress.examReadiness >= 45 ? 'Building momentum' : 'Start with a small review session'}</p></div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-teal-700 transition-[width]" style={{ width: `${progress.examReadiness}%` }} /></div>
            <p className="mt-3 text-sm leading-6 text-stone-700">Readiness combines quiz accuracy (45%), flashcard revision (30%), subject coverage (15%), and active exam planning (10%).</p>
          </div>
        </section>

        <GamificationPanel profile={analytics.gamification} />

        <div className="mt-5 rounded-3xl border border-teal-200 bg-teal-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">What should I study today?</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">{daily.subject ? `Focus on ${daily.subject}` : 'Build your first study plan'}</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-700">{daily.reason}</p>
            </div>
            {daily.examLabel && <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-teal-800">{daily.examLabel}</span>}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-teal-100 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Flashcards</p><p className="mt-2 text-lg font-semibold text-slate-900">{daily.flashcardCount > 0 ? `Review ${daily.flashcardCount} cards` : 'No cards for this subject yet'}</p><p className="mt-1 text-sm text-stone-600">{daily.dueFlashcards} due for review today.</p></div>
            <div className="rounded-2xl border border-teal-100 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Quiz practice</p><p className="mt-2 text-lg font-semibold text-slate-900">{daily.quizLabel}</p><p className="mt-1 text-sm text-stone-600">Use the Quiz section to generate it from your notes.</p></div>
          </div>
        </div>

        <div className="mt-5 hidden rounded-3xl border border-stone-200 bg-stone-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-800">
                Adaptive knowledge profile
              </h3>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Knowledge score combines quiz accuracy (70%) with flashcard mastery (30%) when both are available.
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-600">
              Analytics
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {analytics.knowledgeProfiles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-4 text-sm text-stone-600 md:col-span-3">
                Complete a quiz or create flashcards to build your adaptive profile.
              </div>
            ) : (
              analytics.knowledgeProfiles.slice(0, 3).map((item) => (
                <div key={item.name} className="rounded-2xl border border-stone-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-800">
                    {item.name}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{item.score}%</p>
                  <p className="mt-2 text-xs leading-5 text-stone-600">
                    Quiz: {item.quizScore === null ? '—' : `${item.quizScore}%`} · Flashcards: {item.flashcardScore === null ? '—' : `${item.flashcardScore}%`}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{item.recommendation}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-5 rounded-3xl border border-stone-200 bg-stone-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-800">Topics needing review</h3>
              <p className="mt-2 text-sm leading-6 text-stone-600">Topic scores are calculated from question-level quiz answers.</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-600">Quiz analytics</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {analytics.topicProfiles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-4 text-sm text-stone-600 md:col-span-3">Complete a quiz to see topic-level knowledge.</div>
            ) : analytics.topicProfiles.slice(0, 3).map((item) => (
              <div key={item.name} className="rounded-2xl border border-stone-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-800">{item.name}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{item.score}%</p>
                <p className="mt-2 text-sm leading-6 text-stone-600">{item.quizQuestions} quiz question{item.quizQuestions === 1 ? '' : 's'} · {item.recommendation}</p>
              </div>
            ))}
          </div>
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
