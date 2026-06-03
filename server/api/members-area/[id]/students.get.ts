import { getSupabaseServerClient } from '~/server/utils/supabaseServer'

const formatDateTime = (value?: string | null) => value
  ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
  : ''

const normalizeEmail = (email?: string | null) => String(email || '').trim().toLowerCase()

export default defineEventHandler(async (event) => {
  const membersAreaId = String(getRouterParam(event, 'id') || '')
  const currentUserEmail = normalizeEmail(getQuery(event).currentUserEmail as string | undefined)
  const supabase = getSupabaseServerClient()

  if (!supabase) throw createError({ statusCode: 500, statusMessage: 'Supabase nao configurado no servidor.' })
  if (!membersAreaId) throw createError({ statusCode: 400, statusMessage: 'Area de membros obrigatoria.' })

  const { data: courses } = await supabase
    .from('courses')
    .select('product_id')
    .eq('members_area_id', membersAreaId)

  const productIds = (courses || []).map((course: Record<string, any>) => course.product_id).filter(Boolean)
  if (!productIds.length) return []

  const { data: manualDeliveries, error: deliveriesError } = await supabase
    .from('product_deliveries')
    .select('id,customer_email,created_at,product_id,status,sale_id')
    .in('product_id', productIds)
    .eq('status', 'active')
    .is('sale_id', null)
    .order('created_at', { ascending: false })

  if (deliveriesError) throw createError({ statusCode: 400, statusMessage: deliveriesError.message })

  const deliveryStudents = (manualDeliveries || []).map((row: Record<string, any>, index: number) => ({
    id: row.id,
    name: row.customer_email || `Aluno ${index + 1}`,
    email: row.customer_email || '',
    lastAccess: formatDateTime(row.created_at),
    progress: index === 0 ? 100 : 0,
    isCurrentUser: Boolean(currentUserEmail && normalizeEmail(row.customer_email) === currentUserEmail)
  }))

  const deliveryEmails = new Set(deliveryStudents.map((student) => normalizeEmail(student.email)).filter(Boolean))

  const { data: sales, error: salesError } = await supabase
    .from('sales')
    .select('id,customer_name,customer_email,status,created_at,paid_at,product_id')
    .in('product_id', productIds)
    .in('status', ['approved', 'Pago'])
    .order('created_at', { ascending: false })

  if (salesError) throw createError({ statusCode: 400, statusMessage: salesError.message })

  const saleStudents = (sales || [])
    .filter((row: Record<string, any>) => !deliveryEmails.has(normalizeEmail(row.customer_email)))
    .map((row: Record<string, any>, index: number) => ({
      id: row.id,
      name: row.customer_name || row.customer_email || `Aluno ${index + 1}`,
      email: row.customer_email || '',
      lastAccess: formatDateTime(row.paid_at || row.created_at),
      progress: index === 0 ? 100 : 0,
      isCurrentUser: Boolean(currentUserEmail && normalizeEmail(row.customer_email) === currentUserEmail)
    }))

  return [...deliveryStudents, ...saleStudents]
})
