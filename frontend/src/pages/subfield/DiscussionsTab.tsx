import { MessageSquare, Plus, Send } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import { SignInPrompt } from '../../components/SignInPrompt'
import { TopicListItem } from '../../components/TopicListItem'
import { Button, Card, EmptyState, ErrorState, FormError, Spinner } from '../../components/ui'
import { api, errorMessage } from '../../lib/api'
import { topicKindLabels } from '../../lib/format'
import type { SubFieldDetail, TopicDetail, TopicKind, TopicSummary } from '../../lib/types'
import { useApi } from '../../lib/useApi'

const kinds: TopicKind[] = ['Question', 'Advice', 'Experience', 'Resource']

export function DiscussionsTab({ subField }: { subField: SubFieldDetail }) {
  const { user } = useAuth()
  const { data: topics, error, reload } = useApi<TopicSummary[]>(`/subfields/${subField.slug}/topics`)
  const [composing, setComposing] = useState(false)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Ask questions and share experiences. Answers from verified experts are highlighted.
        </p>
        {user && !composing && (
          <Button onClick={() => setComposing(true)}>
            <Plus className="size-4" />
            Start a topic
          </Button>
        )}
      </div>

      {!user && <SignInPrompt title="Join the conversation" description="Sign in to ask questions and reply to others." />}
      {user && composing && <NewTopicForm subFieldSlug={subField.slug} onCancel={() => setComposing(false)} />}

      {!topics && (error ? <ErrorState message={error} onRetry={reload} /> : <Spinner />)}
      {topics && topics.length === 0 && (
        <EmptyState icon={MessageSquare} title="No discussions yet">
          Be the first to ask a question about {subField.name}.
        </EmptyState>
      )}
      {topics && topics.length > 0 && (
        <div className="space-y-3">
          {topics.map((topic) => (
            <TopicListItem key={topic.id} topic={topic} />
          ))}
        </div>
      )}
    </div>
  )
}

function NewTopicForm({ subFieldSlug, onCancel }: { subFieldSlug: string; onCancel: () => void }) {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [kind, setKind] = useState<TopicKind>('Question')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const topic = await api<TopicDetail>(`/subfields/${subFieldSlug}/topics`, {
        method: 'POST',
        body: { title, body, kind },
      })
      navigate(`/topics/${topic.id}`)
    } catch (err) {
      setError(errorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <Card className="p-5">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
          <div>
            <label htmlFor="topic-title" className="label">
              Title
            </label>
            <input
              id="topic-title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What would you like to ask or share?"
              minLength={5}
              maxLength={140}
              required
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="topic-kind" className="label">
              Type
            </label>
            <select id="topic-kind" className="input" value={kind} onChange={(e) => setKind(e.target.value as TopicKind)}>
              {kinds.map((k) => (
                <option key={k} value={k}>
                  {topicKindLabels[k]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="topic-body" className="label">
            Details
          </label>
          <textarea
            id="topic-body"
            className="input min-h-32"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Give some context so others can help you."
            minLength={10}
            maxLength={5000}
            required
          />
        </div>
        <FormError message={error} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            <Send className="size-4" />
            {submitting ? 'Posting...' : 'Post topic'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
