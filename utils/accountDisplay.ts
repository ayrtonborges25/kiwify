export const accountDisplayName = 'Ayrton Borges'

export const normalizeAccountDisplayName = (value?: string | null, fallback = accountDisplayName) => {
  const text = String(value || '').trim()
  if (!text) return fallback
  if (/^(admin kiwify|digital borges|digital borges ltda|retratistas digitais|retratistas dig\.\.\.)$/i.test(text)) return fallback
  return text
}
