import { ArrowLeft, ArrowRight, RotateCcw, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { DynamicIcon } from '../components/DynamicIcon'
import { ProgressBar } from '../components/Meters'
import { Button, ButtonLink, Card, PageLoader } from '../components/ui'
import { cn, pathAccent } from '../lib/styles'
import type { FieldDetail } from '../lib/types'
import { useApi } from '../lib/useApi'

type Scores = Partial<Record<string, number>>

interface Question {
  text: string
  answers: { text: string; scores: Scores }[]
}

const questions: Question[] = [
  {
    text: 'Which of these sounds the most fun?',
    answers: [
      { text: 'Making a game that people play', scores: { 'game-development': 3 } },
      { text: 'Building a website or web app', scores: { 'web-development': 3 } },
      { text: 'Finding patterns hidden in data', scores: { 'data-science-ai': 3 } },
      { text: 'Finding weak spots in systems before attackers do', scores: { cybersecurity: 3 } },
      { text: 'Making an app for my phone', scores: { 'mobile-development': 3 } },
      { text: 'Keeping big systems running smoothly', scores: { 'cloud-devops': 3 } },
    ],
  },
  {
    text: 'Which subject do you enjoy the most?',
    answers: [
      { text: 'Math and statistics', scores: { 'data-science-ai': 2, 'game-development': 1 } },
      { text: 'Art and design', scores: { 'game-development': 2, 'web-development': 1, 'mobile-development': 1 } },
      { text: 'Puzzles and logic problems', scores: { cybersecurity: 2, 'cloud-devops': 1 } },
      { text: 'Building and fixing things', scores: { 'cloud-devops': 2, 'mobile-development': 1 } },
      { text: 'Writing and explaining ideas', scores: { 'web-development': 2, 'data-science-ai': 1 } },
    ],
  },
  {
    text: 'What kind of result makes you proud?',
    answers: [
      { text: 'Seeing my work on screen right away', scores: { 'web-development': 2, 'mobile-development': 2 } },
      { text: 'Solving a mystery after a long investigation', scores: { 'data-science-ai': 2, cybersecurity: 2 } },
      { text: 'Everything just works, every single day', scores: { 'cloud-devops': 3 } },
      { text: 'Watching people enjoy something I made', scores: { 'game-development': 3, 'mobile-development': 1 } },
    ],
  },
  {
    text: 'Pick a weekend project.',
    answers: [
      { text: 'Make a small game for a game jam', scores: { 'game-development': 3 } },
      { text: 'Build my own portfolio website', scores: { 'web-development': 3 } },
      { text: 'Analyze my music listening history', scores: { 'data-science-ai': 3 } },
      { text: 'Solve a capture-the-flag hacking challenge', scores: { cybersecurity: 3 } },
      { text: 'Build a habit tracker app for my phone', scores: { 'mobile-development': 3 } },
      { text: 'Run my own server at home', scores: { 'cloud-devops': 3 } },
    ],
  },
  {
    text: 'What matters most to you in a first job?',
    answers: [
      { text: 'Lots of job openings', scores: { 'web-development': 2, 'cloud-devops': 1, 'data-science-ai': 1 } },
      { text: 'Creative work', scores: { 'game-development': 2, 'mobile-development': 1, 'web-development': 1 } },
      { text: 'Hard problems with real stakes', scores: { cybersecurity: 2, 'data-science-ai': 1, 'cloud-devops': 1 } },
      { text: 'Being able to work remotely', scores: { 'web-development': 1, 'cloud-devops': 1, 'mobile-development': 1, 'data-science-ai': 1 } },
    ],
  },
]

export function QuizPage() {
  const { data: field } = useApi<FieldDetail>('/fields/it')
  const [answers, setAnswers] = useState<number[]>([])

  if (!field) return <PageLoader />

  const index = answers.length
  const finished = index >= questions.length

  if (finished) {
    const totals = new Map<string, number>()
    answers.forEach((answerIndex, questionIndex) => {
      for (const [slug, points] of Object.entries(questions[questionIndex].answers[answerIndex].scores)) {
        totals.set(slug, (totals.get(slug) ?? 0) + (points ?? 0))
      }
    })
    const ranked = field.subFields
      .map((subField) => ({ subField, score: totals.get(subField.slug) ?? 0 }))
      .sort((a, b) => b.score - a.score)
    const best = ranked[0].score || 1
    const [top, ...rest] = ranked
    const accent = pathAccent(top.subField.slug)

    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="text-center">
          <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-indigo-600">
            <Sparkles className="size-4" />
            Your best match
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">{top.subField.name}</h1>
          <p className="mt-2 text-slate-600">{top.subField.tagline}</p>
        </div>

        <Card className="overflow-hidden">
          <div className={cn('flex items-center gap-4 bg-linear-to-r p-6 text-white', accent.gradient)}>
            <DynamicIcon name={top.subField.icon} className="size-10" />
            <p className="flex-1 text-sm text-white/90">
              Read the reality check before you decide: what a normal day looks like, how hard it is to get in and who it
              suits.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 p-6">
            <ButtonLink to={`/fields/${field.slug}/${top.subField.slug}`}>
              Explore {top.subField.name}
              <ArrowRight className="size-4" />
            </ButtonLink>
            <ButtonLink to={`/fields/${field.slug}/${top.subField.slug}?tab=roadmap`} variant="secondary">
              See the roadmap
            </ButtonLink>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold text-slate-900">Also worth a look</h2>
          <ul className="mt-4 space-y-3">
            {rest.map(({ subField, score }) => (
              <li key={subField.slug}>
                <Link to={`/fields/${field.slug}/${subField.slug}`} className="group block">
                  <span className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium text-slate-800 group-hover:text-indigo-600">
                      <DynamicIcon name={subField.icon} className="size-4 text-slate-400" />
                      {subField.name}
                    </span>
                    <span className="text-slate-500">{Math.round((score / best) * 100)}% match</span>
                  </span>
                  <ProgressBar value={score} max={best} className="mt-1.5 h-1.5" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <p className="text-center text-sm text-slate-500">
          This quiz is a starting point, not a verdict. Talking to people already on a path is the best next step.
        </p>
        <div className="flex justify-center">
          <Button variant="ghost" onClick={() => setAnswers([])}>
            <RotateCcw className="size-4" />
            Take the quiz again
          </Button>
        </div>
      </div>
    )
  }

  const question = questions[index]

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            Question {index + 1} of {questions.length}
          </span>
          {index > 0 && (
            <button type="button" onClick={() => setAnswers(answers.slice(0, -1))} className="flex items-center gap-1 hover:text-slate-800">
              <ArrowLeft className="size-4" />
              Back
            </button>
          )}
        </div>
        <ProgressBar value={index} max={questions.length} className="mt-2" />
      </div>

      <h1 className="text-2xl font-bold text-slate-900">{question.text}</h1>

      <div className="grid gap-3">
        {question.answers.map((answer, answerIndex) => (
          <button
            key={answer.text}
            type="button"
            onClick={() => setAnswers([...answers, answerIndex])}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-left font-medium text-slate-800 shadow-sm transition hover:border-indigo-400 hover:bg-indigo-50"
          >
            {answer.text}
            <ArrowRight className="size-4 text-slate-300" />
          </button>
        ))}
      </div>
    </div>
  )
}
