import { getSupabaseClient } from '~/utils/supabase'

export type StudentCourse = {
  deliveryId: string
  productId: string
  productName: string
  coverUrl: string
  membersAreaId: string
  accessUrl: string
  progress: number
}

const normalizeEmail = (email?: string | null) => String(email || '').trim().toLowerCase()
export const getMyCourses = async (): Promise<StudentCourse[]> => {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data: userData, error: userError } = await supabase.auth.getUser()
  const user = userData?.user
  const email = normalizeEmail(user?.email)
  if (userError || !user?.id || !email) return []

  const { data: deliveries, error } = await supabase
    .from('product_deliveries')
    .select('id,user_id,product_id,customer_email,access_url,status')
    .or(`user_id.eq.${user.id},customer_email.ilike.${email}`)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error || !deliveries?.length) return []

  const approvedDeliveries = deliveries.filter((delivery: Record<string, any>) => {
    return (
      (delivery.user_id === user.id || normalizeEmail(delivery.customer_email) === email) &&
      String(delivery.status || '').toLowerCase() === 'active'
    )
  })

  const productIds = Array.from(new Set(approvedDeliveries
    .map((delivery: Record<string, any>) => delivery.product_id)
    .filter(Boolean)))

  if (!productIds.length) return []

  const [{ data: products }, { data: memberAreas }] = await Promise.all([
    supabase
      .from('products')
      .select('id,name,image_url')
      .in('id', productIds),
    supabase
      .from('courses')
      .select('id,title,cover_url,product_id,members_area_id,members_areas(id,title,cover_url)')
      .in('product_id', productIds)
  ])

  const productsById = new Map((products || []).map((product: Record<string, any>) => [product.id, product]))
  const coursesByProductId = new Map<string, Record<string, any>>()
  ;(memberAreas || []).forEach((course: Record<string, any>) => {
    if (course.product_id && !coursesByProductId.has(course.product_id)) {
      coursesByProductId.set(course.product_id, course)
    }
  })

  const seen = new Set<string>()
  return approvedDeliveries
    .map((delivery: Record<string, any>) => {
      const productId = delivery.product_id
      if (!productId || seen.has(productId)) return null
      seen.add(productId)

      const product = productsById.get(productId) || {}
      const course = coursesByProductId.get(productId) || {}
      const area = Array.isArray(course.members_areas) ? course.members_areas[0] : course.members_areas
      const membersAreaId = area.id || String(delivery.access_url || '').replace('/club=', '') || productId

      return {
        deliveryId: delivery.id,
        productId,
        productName: course.title || product.name || area?.title || 'Curso',
        coverUrl: course.cover_url || area?.cover_url || product.image_url || '',
        membersAreaId,
        accessUrl: `/club=${membersAreaId}`,
        progress: 0
      }
    })
    .filter(Boolean) as StudentCourse[]
}
