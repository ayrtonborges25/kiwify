import { getSupabaseServerClient } from '~/server/utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const query = getQuery(event)
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Produto nao informado.'
    })
  }

  const supabase = getSupabaseServerClient()
  if (!supabase) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase nao configurado no servidor.'
    })
  }

  const courseIds = new Set<string>()
  const membersAreaIds = new Set<string>()
  const manualCourseId = typeof query.courseId === 'string' ? query.courseId : ''
  const manualMembersAreaId = typeof query.membersAreaId === 'string' ? query.membersAreaId : ''

  if (manualCourseId) courseIds.add(manualCourseId)
  if (manualMembersAreaId) membersAreaIds.add(manualMembersAreaId)

  const isMissingColumnError = (error: any) => error?.code === 'PGRST204' || String(error?.message || '').includes('column')

  const { data: productCourses, error: productCoursesError } = await supabase
    .from('courses')
    .select('id, members_area_id')
    .eq('product_id', id)

  if (productCoursesError && !isMissingColumnError(productCoursesError)) {
    throw createError({
      statusCode: 500,
      statusMessage: productCoursesError.message
    })
  }

  productCourses?.forEach((course) => {
    if (course.id) courseIds.add(course.id)
    if (course.members_area_id) membersAreaIds.add(course.members_area_id)
  })

  const { data: productAreas, error: productAreasError } = await supabase
    .from('members_areas')
    .select('id, courses(id)')
    .eq('product_id', id)

  if (productAreasError && !isMissingColumnError(productAreasError)) {
    throw createError({
      statusCode: 500,
      statusMessage: productAreasError.message
    })
  }

  productAreas?.forEach((area) => {
    if (area.id) membersAreaIds.add(area.id)
    area.courses?.forEach((course: { id?: string }) => {
      if (course.id) courseIds.add(course.id)
    })
  })

  if (courseIds.size) {
    const { error } = await supabase
      .from('courses')
      .delete()
      .in('id', Array.from(courseIds))

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message
      })
    }
  }

  const { error: deleteProductError } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (deleteProductError) {
    throw createError({
      statusCode: 500,
      statusMessage: deleteProductError.message
    })
  }

  for (const membersAreaId of membersAreaIds) {
    const { count, error: countError } = await supabase
      .from('courses')
      .select('id', { count: 'exact', head: true })
      .eq('members_area_id', membersAreaId)

    if (!countError && Number(count || 0) === 0) {
      await supabase.from('members_areas').delete().eq('id', membersAreaId)
    }
  }

  return {
    ok: true,
    deletedProductId: id,
    deletedCourses: courseIds.size,
    checkedMembersAreas: membersAreaIds.size
  }
})
