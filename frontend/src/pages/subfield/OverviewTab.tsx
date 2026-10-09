import { ArrowRight, Briefcase, CircleCheck, Clock, Gauge, Sun, TriangleAlert, Wrench } from 'lucide-react'
import type { ReactNode } from 'react'
import { DifficultyMeter } from '../../components/Meters'
import { Button, Card, Chip } from '../../components/ui'
import type { SubFieldDetail } from '../../lib/types'

function InfoCard({ icon, title, children, className }: { icon: ReactNode; title: string; children: ReactNode; className?: string }) {
  return (
    <Card className={className ?? 'p-6'}>
      <h3 className="flex items-center gap-2 font-semibold text-slate-900">
        {icon}
        {title}
      </h3>
      <div className="mt-3 text-sm text-slate-700">{children}</div>
    </Card>
  )
}

export function OverviewTab({ subField, onStart }: { subField: SubFieldDetail; onStart: () => void }) {
  return (
    <div className="space-y-6">
      <Card className="p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-900">What is {subField.name}?</h2>
        <p className="mt-3 leading-relaxed text-slate-700">{subField.description}</p>
      </Card>

      <div>
        <h2 className="mb-1 text-lg font-semibold text-slate-900">Reality check</h2>
        <p className="mb-4 text-sm text-slate-600">An honest look at the work, before you spend months on it.</p>

        <div className="grid gap-4 lg:grid-cols-3">
          <InfoCard icon={<Sun className="size-5 text-amber-500" />} title="A day in the life" className="p-6 lg:col-span-2">
            <p className="leading-relaxed">{subField.dayInTheLife}</p>
          </InfoCard>

          <InfoCard icon={<Gauge className="size-5 text-indigo-500" />} title="Getting in">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">Entry difficulty</p>
                <div className="mt-1">
                  <DifficultyMeter value={subField.entryDifficulty} />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">Time to job-ready</p>
                <p className="mt-1 flex items-center gap-1.5 font-medium">
                  <Clock className="size-4 text-slate-400" />
                  {subField.timeToJobReady} of steady practice
                </p>
              </div>
            </div>
          </InfoCard>

          <InfoCard icon={<Wrench className="size-5 text-sky-500" />} title="Key skills">
            <div className="flex flex-wrap gap-1.5">
              {subField.keySkills.map((skill) => (
                <Chip key={skill}>{skill}</Chip>
              ))}
            </div>
          </InfoCard>

          <InfoCard icon={<Briefcase className="size-5 text-violet-500" />} title="Typical first jobs">
            <ul className="space-y-1.5">
              {subField.firstJobs.map((job) => (
                <li key={job} className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-violet-400" />
                  {job}
                </li>
              ))}
            </ul>
          </InfoCard>

          <InfoCard icon={<CircleCheck className="size-5 text-emerald-500" />} title="A good fit if...">
            <ul className="space-y-2">
              {subField.goodFitIf.map((item) => (
                <li key={item} className="flex gap-2">
                  <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
          </InfoCard>

          <InfoCard icon={<TriangleAlert className="size-5 text-amber-500" />} title="Think twice if..." className="p-6 lg:col-span-3">
            <ul className="grid gap-2 sm:grid-cols-2">
              {subField.thinkTwiceIf.map((item) => (
                <li key={item} className="flex gap-2">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-500" />
                  {item}
                </li>
              ))}
            </ul>
          </InfoCard>
        </div>
      </div>

      <Card className="flex flex-col items-start gap-4 bg-linear-to-r from-indigo-50 to-violet-50 p-6 sm:flex-row sm:items-center">
        <div className="flex-1">
          <p className="font-semibold text-slate-900">Sounds like you?</p>
          <p className="text-sm text-slate-600">
            Follow the {subField.roadmap.length}-step roadmap built from free resources and track your progress as you go.
          </p>
        </div>
        <Button onClick={onStart}>
          Start the roadmap
          <ArrowRight className="size-4" />
        </Button>
      </Card>
    </div>
  )
}
