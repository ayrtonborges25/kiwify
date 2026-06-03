import { getSupabaseServerClient } from '~/server/utils/supabaseServer'

const requireUser = async (event: any, supabase: NonNullable<ReturnType<typeof getSupabaseServerClient>>) => {
  const token = String(getHeader(event, 'authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Sessao expirada. Faca login novamente.' })

  const { data: userData, error: userError } = await supabase.auth.getUser(token)
  if (userError || !userData.user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Sessao expirada. Faca login novamente.' })
  }

  return userData.user
}

export default defineEventHandler(async (event) => {
  const membersAreaId = String(getRouterParam(event, 'id') || '')
  const studentId = String(getRouterParam(event, 'studentId') || '')
  const supabase = getSupabaseServerClient()

  if (!supabase) throw createError({ statusCode: 500, statusMessage: 'Supabase nao configurado no servidor.' })
  if (!membersAreaId || !studentId) throw createError({ statusCode: 400, statusMessage: 'Aluno obrigatorio.' })

  await requireUser(event, supabase)

  const { data: courses } = await supabase
    .from('courses')
    .select('product_id')
    .eq('members_area_id', membersAreaId)

  const productIds = (courses || []).map((course: Record<string, any>) => course.product_id).filter(Boolean)
  if (!productIds.length) throw createError({ statusCode: 400, statusMessage: 'Essa area ainda nao esta vinculada a um produto.' })

  const { data: delivery } = await supabase
    .from('product_deliveries')
    .select('id,sale_id,product_id,status')
    .eq('id', studentId)
    .in('product_id', productIds)
    .maybeSingle()

  let deliveryId = delivery?.id || ''
  if (!deliveryId) {
    const { data: saleDelivery } = await supabase
      .from('product_deliveries')
      .select('id,sale_id,product_id,status')
      .eq('sale_id', studentId)
      .in('product_id', productIds)
      .maybeSingle()
    deliveryId = saleDelivery?.id || ''
  }

  if (!deliveryId) throw createError({ statusCode: 404, statusMessage: 'Acesso do aluno nao encontrado.' })

  const { error: updateError } = await supabase
    .from('product_deliveries')
    .update({ status: 'revoked' })
    .eq('id', deliveryId)

  if (updateError) throw createError({ statusCode: 400, statusMessage: updateError.message })

  const { data: area } = await supabase
    .from('members_areas')
    .select('students')
    .eq('id', membersAreaId)
    .maybeSingle()

  if (area) {
    await supabase
      .from('members_areas')
      .update({ students: Math.max(0, Number(area.students || 0) - 1) })
      .eq('id', membersAreaId)
  }

  return { removed: true }
})
