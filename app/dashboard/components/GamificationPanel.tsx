import type { Badge, GamificationProfile } from '../../lib/gamification'

type GamificationPanelProps = { profile: GamificationProfile }

const badgeMarks: Record<Badge['id'], string> = {
  'streak-7': '7',
  'reviews-100': '100',
  'quiz-ace': '90',
  'daily-goals': '✓',
}

function BadgeCard({ badge }: { badge: Badge }) {
  const mark = badgeMarks[badge.id]

  return (
    <article className={`group relative overflow-hidden rounded-2xl border p-4 transition ${badge.unlocked ? 'border-amber-200 bg-linear-to-br from-amber-50 via-white to-white shadow-[0_10px_28px_-22px_rgba(146,64,14,0.6)]' : 'border-stone-200 bg-stone-50'}`}>
      <div className="flex items-start gap-3">
        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full border-4 text-sm font-bold tracking-tight ${badge.unlocked ? 'border-amber-100 bg-amber-500 text-white shadow-sm' : 'border-stone-200 bg-white text-stone-400'}`} aria-hidden="true">
          {mark}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-slate-900">{badge.name}</h4>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${badge.unlocked ? 'bg-amber-100 text-amber-900' : 'bg-stone-200 text-stone-500'}`}>
              {badge.unlocked ? 'Earned' : 'Locked'}
            </span>
          </div>
          <p className="mt-2 text-xs leading-5 text-stone-600">{badge.description}</p>
        </div>
      </div>
      {badge.unlocked && <div className="absolute -right-4 -top-5 h-16 w-16 rounded-full bg-amber-200/35 blur-xl" aria-hidden="true" />}
    </article>
  )
}

export default function GamificationPanel({ profile }: GamificationPanelProps) {
  const levelProgress = Math.round((profile.pointsIntoLevel / profile.pointsForNextLevel) * 100)
  const completedGoals = profile.dailyGoals.filter((goal) => goal.progress >= goal.target).length

  return (
    <section className="mt-5 rounded-3xl border border-amber-200 bg-amber-50/70 p-5 sm:p-6" aria-labelledby="gamification-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="gamification-title" className="text-xl font-semibold text-slate-900">Your study rewards</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">Earn points through reviews and quizzes. Your level updates automatically from completed activity.</p>
        </div>
        <div className="flex min-w-[10rem] items-center gap-3 rounded-2xl border border-amber-200 bg-white p-3 shadow-[0_10px_24px_-22px_rgba(146,64,14,0.8)]">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-500 text-base font-bold text-white shadow-sm">
            {profile.level}
          </div>
          <div className="text-left">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-800">Current level</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900">Level {profile.level}</p>
            <p className="mt-0.5 text-xs text-stone-500">{profile.points} XP earned</p>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-amber-100 bg-white p-4">
        <div className="flex items-center justify-between gap-3 text-sm"><span className="font-semibold text-slate-800">Next level</span><span className="text-stone-600">{profile.pointsIntoLevel}/{profile.pointsForNextLevel} points</span></div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-amber-100"><div className="h-full rounded-full bg-amber-500 transition-[width]" style={{ width: `${levelProgress}%` }} /></div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="rounded-2xl border border-amber-100 bg-white p-4">
          <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-800">Daily goals</h3><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">{completedGoals}/{profile.dailyGoals.length} complete</span></div>
          <div className="mt-4 space-y-3">{profile.dailyGoals.map((goal) => { const value = Math.min(goal.progress, goal.target); const complete = value >= goal.target; return <div key={goal.id}><div className="flex justify-between gap-3 text-sm"><span className="font-medium text-slate-800">{complete ? '✓ ' : ''}{goal.label}</span><span className="text-stone-600">{value}/{goal.target} {goal.unit}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100"><div className={`h-full rounded-full ${complete ? 'bg-teal-600' : 'bg-amber-500'}`} style={{ width: `${(value / goal.target) * 100}%` }} /></div></div> })}</div>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-800">Badges</h3><p className="mt-1 text-xs text-stone-500">Milestones you earn from real study activity.</p></div><span className="text-xs font-semibold text-stone-500">{profile.badges.filter((badge) => badge.unlocked).length}/{profile.badges.length}</span></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">{profile.badges.map((badge) => <BadgeCard key={badge.id} badge={badge} />)}</div>
        </div>
      </div>
    </section>
  )
}
