import { getSupabaseClient } from '~/utils/supabase'
import { getMockMemberClub, type MemberClubData, type MemberClubLesson, type MemberClubModule } from '~/data/memberClub'

const byPosition = <T extends { position?: number }>(a: T, b: T) => Number(a.position || 0) - Number(b.position || 0)

const normalizeLesson = (row: Record<string, any>, moduleId: string, index: number): MemberClubLesson => ({
  id: row.id || `${moduleId}-lesson-${index}`,
  moduleId,
  title: row.title || `Aula ${index + 1}`,
  description: row.description || row.content || '',
  videoUrl: row.video_url || '',
  duration: row.duration || '',
  position: Number(row.position ?? index + 1),
  status: String(row.status || 'Publicado').toLowerCase().includes('bloque')
    ? 'locked'
    : 'available'
})

const normalizeModule = (
  row: Record<string, any>,
  lessons: Record<string, any>[],
  courseCoverUrl = '',
  index: number
): MemberClubModule => {
  const id = row.id || `module-${index}`
  const moduleLessons = lessons
    .filter((lesson) => lesson.module_id === id)
    .sort(byPosition)
    .map((lesson, lessonIndex) => normalizeLesson(lesson, id, lessonIndex))

  return {
    id,
    title: row.title || `Módulo ${index + 1}`,
    description: row.description || '',
    imageUrl: row.cover_url || row.image_url || courseCoverUrl || '',
    position: Number(row.position ?? index + 1),
    status: String(row.status || 'Publicado').toLowerCase().includes('bloque')
      ? 'locked'
      : 'available',
    lessons: moduleLessons.length
      ? moduleLessons
      : [normalizeLesson({ id: `${id}-lesson`, title: row.title || `Aula ${index + 1}`, status: row.status }, id, 0)]
  }
}

export const getMemberClubById = async (clubId: string): Promise<MemberClubData> => {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) return getMockMemberClub(clubId)

    let { data: area } = await supabase
      .from('members_areas')
      .select('*')
      .eq('id', clubId)
      .maybeSingle()

    if (!area) {
      const { data: courseById } = await supabase
        .from('courses')
        .select('*')
        .eq('id', clubId)
        .maybeSingle()

      if (courseById?.members_area_id) {
        const { data: courseArea } = await supabase
          .from('members_areas')
          .select('*')
          .eq('id', courseById.members_area_id)
          .maybeSingle()

        area = courseArea
      }
    }

    if (!area) return getMockMemberClub(clubId)

    const { data: courses } = await supabase
      .from('courses')
      .select('*')
      .eq('members_area_id', area.id)
      .order('created_at', { ascending: true })

    const primaryCourse = courses?.[0] || {
      id: area.id,
      title: area.title,
      description: area.description,
      cover_url: area.cover_url
    }

    const { data: moduleRows } = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', primaryCourse.id)
      .order('position', { ascending: true })

    const { data: lessonRows } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', primaryCourse.id)
      .order('position', { ascending: true })

    const modules = (moduleRows || [])
      .sort(byPosition)
      .map((module, index) => normalizeModule(module, lessonRows || [], primaryCourse.cover_url || area.cover_url || '', index))

    const fallback = getMockMemberClub(area.id)
    const customization = area.customization || {}

    return {
      club: {
        id: area.id,
        title: customization.heroTitle || area.title || primaryCourse.title || fallback.club.title,
        subtitle: area.description || '',
        instagramUrl: area.instagram_url || fallback.club.instagramUrl,
        supportUrl: area.support_url || fallback.club.supportUrl,
        brandName: customization.brandName || area.brand_name || fallback.club.brandName,
        logoUrl: customization.logoUrl || area.logo_url || '',
        customization
      },
      course: {
        id: primaryCourse.id,
        title: primaryCourse.title || area.title || fallback.course.title,
        description: primaryCourse.description || area.description || '',
        coverUrl: customization.bannerUrl || primaryCourse.cover_url || area.cover_url || ''
      },
      modules: modules.length ? modules : fallback.modules
    }
  } catch {
    return getMockMemberClub(clubId)
  }
}
