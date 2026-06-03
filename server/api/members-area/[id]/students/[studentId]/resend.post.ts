import { getSupabaseServerClient } from '~/server/utils/supabaseServer'
import { sendProductAccessEmail } from '~/server/utils/deliveryEmail'

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

  let { data: delivery, error: deliveryError } = await supabase
    .from('product_deliveries')
    .select('id,sale_id,product_id,customer_email,access_url,access_email_sent_at,status,created_at')
    .eq('id', studentId)
    .in('product_id', productIds)
    .maybeSingle()

  if (deliveryError) throw createError({ statusCode: 400, statusMessage: deliveryError.message })

  let sale: Record<string, any> | null = null
  if (!delivery) {
    const { data: saleRow, error: saleError } = await supabase
      .from('sales')
      .select('id,product_id,customer_email')
      .eq('id', studentId)
      .in('product_id', productIds)
      .maybeSingle()

    if (saleError) throw createError({ statusCode: 400, statusMessage: saleError.message })
    if (!saleRow) throw createError({ statusCode: 404, statusMessage: 'Aluno nao encontrado.' })
    sale = saleRow

    const { data: deliveryBySale } = await supabase
      .from('product_deliveries')
      .select('id,sale_id,product_id,customer_email,access_url,access_email_sent_at,status,created_at')
      .eq('sale_id', saleRow.id)
      .maybeSingle()

    delivery = deliveryBySale
  }

  if (!delivery) throw createError({ statusCode: 404, statusMessage: 'Acesso do aluno nao encontrado.' })

  const sent = await sendProductAccessEmail(supabase, {
    id: delivery.sale_id || sale?.id || delivery.id,
    product_id: delivery.product_id || sale?.product_id,
    customer_email: delivery.customer_email || sale?.customer_email
  }, delivery, { force: true })

  if (!sent) throw createError({ statusCode: 400, statusMessage: 'Nao foi possivel reenviar o email de acesso.' })

  return { sent: true }
})
