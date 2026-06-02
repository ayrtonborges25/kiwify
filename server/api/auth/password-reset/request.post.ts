import { createHash, randomInt } from 'node:crypto'
import { getSupabaseServerClient } from '~/server/utils/supabaseServer'
import { sendPasswordResetCodeEmail } from '~/server/utils/passwordResetEmail'

const normalizeEmail = (email?: string | null) => String(email || '').trim().toLowerCase()
const hashCode = (email: string, code: string) => createHash('sha256').update(`${email}:${code}`).digest('hex')
const rateBuckets = new Map<string, { count: number; resetAt: number }>()

const isRateLimited = (key: string, max: number, windowMs: number) => {
  const now = Date.now()
  const current = rateBuckets.get(key)

  if (!current || current.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }

  current.count += 1
  return current.count > max
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string }>(event)
  const email = normalizeEmail(body?.email)

  if (!email || !email.includes('@')) {
    throw createError({ statusCode: 400, statusMessage: 'Informe um e-mail valido.' })
  }

  const supabase = getSupabaseServerClient()
  if (!supabase) {
    throw createError({ statusCode: 500, statusMessage: 'Supabase nao configurado.' })
  }

  const genericResponse = {
    ok: true,
    message: 'Se o e-mail existir, um codigo sera enviado.'
  }

  const requestIp = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  if (
    isRateLimited(`email:${email}`, 3, 5 * 60 * 1000) ||
    isRateLimited(`ip:${requestIp}`, 10, 5 * 60 * 1000)
  ) {
    return genericResponse
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', email)
    .maybeSingle()

  if (!profile?.id) return genericResponse

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('password_reset_codes')
    .select('id', { count: 'exact', head: true })
    .eq('email', email)
    .gte('created_at', fiveMinutesAgo)

  if ((count || 0) >= 3) return genericResponse

  const code = String(randomInt(0, 1000000)).padStart(6, '0')
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

  await supabase
    .from('password_reset_codes')
    .update({ consumed_at: new Date().toISOString() })
    .eq('email', email)
    .is('consumed_at', null)

  const { error } = await supabase
    .from('password_reset_codes')
    .insert({
      user_id: profile.id,
      email,
      code_hash: hashCode(email, code),
      request_ip: requestIp,
      user_agent: getHeader(event, 'user-agent') || null,
      expires_at: expiresAt
    })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Nao foi possivel gerar o codigo.' })
  }

  await sendPasswordResetCodeEmail(email, code)

  return genericResponse
})
