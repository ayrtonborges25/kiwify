import { getSupabaseServerClient } from '~/server/utils/supabaseServer'

type UpdateStudentPayload = {
  name?: string
  email?: string
  groupId?: string
}

const normalizeEmail = (email?: string | null) => String(email || '').trim().toLowerCase()

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
  const payload = await readBody<UpdateStudentPayload>(event)
  const email = normalizeEmail(payload.email)
  const name = String(payload.name || '').trim() || email
  const supabase = getSupabaseServerClient()

  if (!supabase) throw createError({ statusCode: 500, statusMessage: 'Supabase nao configurado no servidor.' })
  if (!membersAreaId || !studentId) throw createError({ statusCode: 400, statusMessage: 'Aluno obrigatorio.' })
  if (!email) throw createError({ statusCode: 400, statusMessage: 'Informe o e-mail do aluno.' })

  await requireUser(event, supabase)

  const { data: courses } = await supabase
    .from('courses')
    .select('product_id')
    .eq('members_area_id', membersAreaId)

  const productIds = (courses || []).map((course: Record<string, any>) => course.product_id).filter(Boolean)
  if (!productIds.length) throw createError({ statusCode: 400, statusMessage: 'Essa area ainda nao esta vinculada a um produto.' })

  const { data: delivery } = await supabase
    .from('product_deliveries')
    .select('id,sale_id,product_id,customer_email,created_at,status')
    .eq('id', studentId)
    .in('product_id', productIds)
    .maybeSingle()

  if (delivery?.id) {
    const { data: updatedDelivery, error: updateError } = await supabase
      .from('product_deliveries')
      .update({ customer_email: email })
      .eq('id', delivery.id)
      .select('id,sale_id,product_id,customer_email,created_at,status')
      .single()

    if (updateError) throw createError({ statusCode: 400, statusMessage: updateError.message })

    return {
      id: updatedDelivery.id,
      customer_name: name,
      customer_email: updatedDelivery.customer_email || email,
      created_at: updatedDelivery.created_at || new Date().toISOString(),
      paid_at: null,
      progress: 0
    }
  }

  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .select('id,product_id,customer_name,customer_email,created_at,paid_at')
    .eq('id', studentId)
    .in('product_id', productIds)
    .maybeSingle()

  if (saleError) throw createError({ statusCode: 400, statusMessage: saleError.message })
  if (!sale?.id) throw createError({ statusCode: 404, statusMessage: 'Aluno nao encontrado.' })

  const { data: updatedSale, error: updateSaleError } = await supabase
    .from('sales')
    .update({ customer_name: name, customer_email: email })
    .eq('id', sale.id)
    .select('id,product_id,customer_name,customer_email,created_at,paid_at')
    .single()

  if (updateSaleError) throw createError({ statusCode: 400, statusMessage: updateSaleError.message })

  await supabase
    .from('product_deliveries')
    .update({ customer_email: email })
    .eq('sale_id', sale.id)

  return {
    id: updatedSale.id,
    customer_name: updatedSale.customer_name || name,
    customer_email: updatedSale.customer_email || email,
    created_at: updatedSale.created_at || new Date().toISOString(),
    paid_at: updatedSale.paid_at,
    progress: 0
  }
})
