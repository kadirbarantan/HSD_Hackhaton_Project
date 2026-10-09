import { Send } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { errorMessage } from '../lib/api'
import { Button, Dialog, FormError } from './ui'

interface MessageDialogProps {
  title: string
  subtitle?: ReactNode
  label: string
  hint?: string
  defaultMessage: string
  submitLabel: string
  /** Extra fields rendered above the message box, e.g. which listing an invitation is for. */
  extra?: ReactNode
  onClose: () => void
  onSubmit: (message: string) => Promise<void>
}

export function MessageDialog({
  title,
  subtitle,
  label,
  hint,
  defaultMessage,
  submitLabel,
  extra,
  onClose,
  onSubmit,
}: MessageDialogProps) {
  const [message, setMessage] = useState(defaultMessage)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSending(true)
    setError(null)
    try {
      await onSubmit(message)
    } catch (err) {
      setError(errorMessage(err))
      setSending(false)
    }
  }

  return (
    <Dialog title={title} subtitle={subtitle} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {extra}
        <div>
          <label htmlFor="dialog-message" className="label">
            {label}
          </label>
          <textarea
            id="dialog-message"
            className="input min-h-36"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            minLength={20}
            maxLength={800}
            required
            autoFocus
          />
          <p className="mt-1 text-xs text-slate-500">{hint ?? `${message.length} of 800 characters. At least 20.`}</p>
        </div>

        <FormError message={error} />

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={sending}>
            <Send className="size-4" />
            {sending ? 'Sending...' : submitLabel}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
