export const accountDisplayName = 'Ayrton Borges'

export const normalizeAccountDisplayName = (value?: string | null) => {
  const text = String(value || '').trim()
  if (!text) return accountDisplayName
  if (/^(admin kiwify|digital borges|digital borges ltda|retratistas digitais|retratistas dig\.\.\.)$/i.test(text)) return accountDisplayName
  return text
}
