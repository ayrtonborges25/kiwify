#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'

const email = process.argv[2]?.trim().toLowerCase()
const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!email) {
  console.error('Uso: node --experimental-strip-types --env-file=.env scripts/promote-admin.ts email@dominio.com')
  process.exit(1)
}

if (!supabaseUrl || !serviceRoleKey) {
  console.error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar no ambiente.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const { data: profile, error: findError } = await supabase
  .from('profiles')
  .select('id, email, role')
  .eq('email', email)
  .maybeSingle()

if (findError) {
  console.error(`Erro ao buscar profile: ${findError.message}`)
  process.exit(1)
}

if (!profile) {
  console.error(`Profile nao encontrado para ${email}. Crie/login o usuario antes de promover.`)
  process.exit(1)
}

const { error: updateError } = await supabase
  .from('profiles')
  .update({ role: 'admin', updated_at: new Date().toISOString() })
  .eq('id', profile.id)

if (updateError) {
  console.error(`Erro ao promover admin: ${updateError.message}`)
  process.exit(1)
}

console.log(`Usuario promovido para admin: ${profile.email}`)
