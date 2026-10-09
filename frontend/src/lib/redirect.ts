/** Reads the `from` path that RequireAuth and SignInPrompt put in the router state. Only same-site paths are allowed. */
export function redirectTarget(state: unknown): string | null {
  const from = (state as { from?: unknown } | null)?.from
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : null
}
