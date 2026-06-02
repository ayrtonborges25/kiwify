import { createHash, timingSafeEqual } from 'node:crypto'
import { getSupabaseServerClient } from '~/server/utils/supabaseServer'

const normalizeEmail = (email?: string | null) => String(email || '').trim().toLowerCase()
const normalizeCode = (code?: string | null) => String(code || '').replace(/\D/g, '').slice(0, 6)
const hashCode = (email: string, code: string) => createHash('sha256').update(`${email}:${code}`).digest('hex')

const safeCompare = (a: string, b: string) => {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; code?: string; password?: string }>(event)
  const email = normalizeEmail(body?.email)
  const code = normalizeCode(body?.code)
  const password = String(body?.password || '')

  if (!email || !email.includes('@')) {
    throw createError({ statusCode: 400, statusMessage: 'Informe um e-mail valido.' })
  }

  if (code.length !== 6) {
    throw createError({ statusCode: 400, statusMessage: 'Informe o codigo de 6 digitos.' })
  }

  if (password.length < 6) {
    throw createError({ statusCode: 400, statusMessage: 'A senha precisa ter pelo menos 6 caracteres.' })
  }

  const supabase = getSupabaseServerClient()
  if (!supabase) {
    throw createError({ statusCode: 500, statusMessage: 'Supabase nao configurado.' })
  }

  const { data: resetCode, error } = await supabase
    .from('password_reset_codes')
    .select('id, user_id, email, code_hash, attempts, expires_at, consumed_at')
    .eq('email', email)
    .is('consumed_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !resetCode) {
    throw createError({ statusCode: 400, statusMessage: 'Codigo invalido ou expirado.' })
  }

  if (new Date(resetCode.expires_at).getTime() < Date.now() || resetCode.attempts >= 5) {
    await supabase
      .from('password_reset_codes')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', resetCode.id)

    throw createError({ statusCode: 400, statusMessage: 'Codigo invalido ou expirado.' })
  }

  const expectedHash = hashCode(email, code)
  if (!safeCompare(expectedHash, resetCode.code_hash)) {
    const nextAttempts = resetCode.attempts + 1
    await supabase
      .from('password_reset_codes')
      .update({
        attempts: nextAttempts,
        consumed_at: nextAttempts >= 5 ? new Date().toISOString() : null
      })
      .eq('id', resetCode.id)

    throw createError({ statusCode: 400, statusMessage: 'Codigo invalido ou expirado.' })
  }

  const { error: passwordError } = await supabase.auth.admin.updateUserById(resetCode.user_id, {
    password
  })

  if (passwordError) {
    throw createError({ statusCode: 500, statusMessage: 'Nao foi possivel alterar a senha.' })
  }

  await supabase
    .from('password_reset_codes')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', resetCode.id)

  return {
    ok: true,
    message: 'Senha alterada com sucesso.'
  }
})
