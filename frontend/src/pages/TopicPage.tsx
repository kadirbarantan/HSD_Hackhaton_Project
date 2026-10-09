import { ArrowLeft, BadgeCheck, MessageSquare, Send } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { Avatar } from '../components/Avatar'
import { ExpertLabel } from '../components/Meters'
import { SignInPrompt } from '../components/SignInPrompt'
import { TopicKindBadge } from '../components/TopicListItem'
import { Button, Card, ErrorState, FormError, PageLoader } from '../components/ui'
import { api, errorMessage } from '../lib/api'
import { plural, timeAgo } from '../lib/format'
import { cn } from '../lib/styles'
import type { Author, Reply, TopicDetail } from '../lib/types'
import { useApi } from '../lib/useApi'

function AuthorLine({ author, createdAt }: { author: Author; createdAt: string }) {
  const isExpert = author.role === 'Expert'
  return (
    <div className="flex items-center gap-3">
      <Avatar id={author.id} name={author.displayName} size="sm" expert={isExpert} />
      <div className="text-sm">
        <Link to={`/people/${author.id}`} className="font-semibold text-slate-900 hover:text-indigo-600">
          {author.displayName}
        </Link>
        <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
          {isExpert && <ExpertLabel title={author.expertTitle} />}
          <span>{timeAgo(createdAt)}</span>
        </div>
      </div>
    </div>
  )
}

export function TopicPage() {
  const { topicId = '' } = useParams()
  const { user, refresh } = useAuth()
  const { data: topic, error, reload, mutate } = useApi<TopicDetail>(`/topics/${topicId}`)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [replyError, setReplyError] = useState<string | null>(null)

  if (!topic) return error ? <ErrorState message={error} onRetry={reload} /> : <PageLoader />

  async function submit(event: FormEvent, topicIdToReply: number) {
    event.preventDefault()
    setSending(true)
    setReplyError(null)
    try {
      const created = await api<Reply>(`/topics/${topicIdToReply}/replies`, { method: 'POST', body: { body: reply } })
      mutate((t) => ({ ...t, replies: [...t.replies, created] }))
      setReply('')
      void refresh()
    } catch (err) {
      setReplyError(errorMessage(err))
    } finally {
      setSending(false)
    }
  }

  const backLink = `/fields/${topic.fieldSlug}/${topic.subFieldSlug}?tab=discussions`

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to={backLink} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600">
        <ArrowLeft className="size-4" />
        {topic.subFieldName} discussions
      </Link>

      <Card className="p-6 sm:p-8">
        <TopicKindBadge kind={topic.kind} />
        <h1 className="mt-3 text-2xl font-bold text-slate-900">{topic.title}</h1>
        <div className="mt-4">
          <AuthorLine author={topic.author} createdAt={topic.createdAt} />
        </div>
        <p className="mt-5 leading-relaxed whitespace-pre-line text-slate-700">{topic.body}</p>
      </Card>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          <MessageSquare className="size-5 text-slate-400" />
          {plural(topic.replies.length, 'reply', 'replies')}
        </h2>

        {topic.replies.map((r) => {
          const isExpert = r.author.role === 'Expert'
          return (
            <Card key={r.id} className={cn('p-5', isExpert && 'border-amber-300 bg-amber-50/50 ring-1 ring-amber-200')}>
              {isExpert && (
                <p className="mb-3 flex items-center gap-1.5 text-xs font-bold tracking-wide text-amber-700 uppercase">
                  <BadgeCheck className="size-4" />
                  Expert answer
                </p>
              )}
              <AuthorLine author={r.author} createdAt={r.createdAt} />
              <p className="mt-3 leading-relaxed whitespace-pre-line text-slate-700">{r.body}</p>
            </Card>
          )
        })}
      </section>

      {user ? (
        <Card className="p-5">
          <form onSubmit={(event) => void submit(event, topic.id)} className="space-y-3">
            <label htmlFor="reply" className="label">
              Your reply
            </label>
            <textarea
              id="reply"
              className="input min-h-28"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Share what you know, or ask a follow-up question."
              minLength={2}
              maxLength={5000}
              required
            />
            <FormError message={replyError} />
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Helpful replies earn you +5 XP.</p>
              <Button type="submit" disabled={sending}>
                <Send className="size-4" />
                {sending ? 'Posting...' : 'Post reply'}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <SignInPrompt title="Want to reply?" description="Sign in to answer questions and join the conversation." />
      )}
    </div>
  )
}
