import { getSupabaseServerClient } from '~/server/utils/supabaseServer'
import { sendProductAccessEmail } from '~/server/utils/deliveryEmail'

type AddStudentPayload = {
  name?: string
  email?: string
  groupId?: string
}

const normalizeEmail = (email?: string | null) => String(email || '').trim().toLowerCase()

export default defineEventHandler(async (event) => {
  const membersAreaId = String(getRouterParam(event, 'id') || '')
  const payload = await readBody<AddStudentPayload>(event)
  const email = normalizeEmail(payload.email)
  const name = String(payload.name || '').trim() || email
  const token = String(getHeader(event, 'authorization') || '').replace(/^Bearer\s+/i, '').trim()
  const supabase = getSupabaseServerClient()

  if (!supabase) {
    throw createError({ statusCode: 500, statusMessage: 'Supabase nao configurado no servidor.' })
  }

  if (!membersAreaId) throw createError({ statusCode: 400, statusMessage: 'Area de membros obrigatoria.' })
  if (!email) throw createError({ statusCode: 400, statusMessage: 'Informe o e-mail do aluno.' })
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Sessao expirada. Faca login novamente.' })

  const { data: userData, error: userError } = await supabase.auth.getUser(token)
  const user = userData.user
  if (userError || !user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Sessao expirada. Faca login novamente.' })
  }

  const { data: area, error: areaError } = await supabase
    .from('members_areas')
    .select('id,user_id,students')
    .eq('id', membersAreaId)
    .maybeSingle()

  if (areaError) throw createError({ statusCode: 400, statusMessage: areaError.message })
  if (!area?.id) throw createError({ statusCode: 404, statusMessage: 'Area de membros nao encontrada.' })

  const { data: course } = await supabase
    .from('courses')
    .select('product_id')
    .eq('members_area_id', membersAreaId)
    .not('product_id', 'is', null)
    .limit(1)
    .maybeSingle()

  const productId = course?.product_id

  if (!productId) {
    throw createError({ statusCode: 400, statusMessage: 'Essa area ainda nao esta vinculada a um produto.' })
  }

  const { data: existingDelivery } = await supabase
    .from('product_deliveries')
    .select('id,sale_id,product_id,customer_email,access_url,access_email_sent_at,created_at')
    .eq('product_id', productId)
    .eq('customer_email', email)
    .eq('status', 'active')
    .maybeSingle()

  if (existingDelivery) {
    await sendProductAccessEmail(supabase, {
      id: existingDelivery.sale_id || existingDelivery.id,
      product_id: existingDelivery.product_id,
      customer_email: existingDelivery.customer_email || email
    }, {
      id: existingDelivery.id,
      sale_id: existingDelivery.sale_id,
      product_id: existingDelivery.product_id,
      customer_email: existingDelivery.customer_email,
      access_url: existingDelivery.access_url,
      access_email_sent_at: existingDelivery.access_email_sent_at
    })

    return {
      id: existingDelivery.id,
      customer_name: name,
      customer_email: existingDelivery.customer_email || email,
      paid_at: null,
      created_at: existingDelivery.created_at || new Date().toISOString()
    }
  }

  const { data: delivery, error: deliveryError } = await supabase
    .from('product_deliveries')
    .insert({
      user_id: user.id,
      product_id: productId,
      customer_email: email,
      delivery_type: 'members_area',
      access_url: `/club=${membersAreaId}`,
      status: 'active'
    })
    .select('*')
    .single()

  if (deliveryError) throw createError({ statusCode: 400, statusMessage: deliveryError.message })

  await sendProductAccessEmail(supabase, {
    id: delivery.id,
    product_id: delivery.product_id,
    customer_email: delivery.customer_email || email
  }, delivery)

  if (payload.groupId) {
    const { data: group } = await supabase
      .from('members_area_groups')
      .select('students')
      .eq('id', payload.groupId)
      .eq('members_area_id', membersAreaId)
      .maybeSingle()

    if (group) {
      await supabase
        .from('members_area_groups')
        .update({ students: Number(group.students || 0) + 1 })
        .eq('id', payload.groupId)
        .eq('members_area_id', membersAreaId)
    }
  }

  await supabase
    .from('members_areas')
    .update({ students: Number(area.students || 0) + 1 })
    .eq('id', membersAreaId)

  return {
    id: delivery.id,
    customer_name: name,
    customer_email: delivery.customer_email || email,
    paid_at: null,
    created_at: delivery.created_at || new Date().toISOString()
  }
})
