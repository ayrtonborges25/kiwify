import { getSupabaseClient } from '~/utils/supabase'
import { defaultClubBanner, getMockMemberClub, type MemberClubData, type MemberClubLesson, type MemberClubModule } from '~/data/memberClub'

const byPosition = <T extends { position?: number }>(a: T, b: T) => Number(a.position || 0) - Number(b.position || 0)
const localCustomizationKey = (id: string) => `members-area:${id}:customization`
const figurinhasAreaIds = new Set([
  '1cbe33c8-14d3-4612-81e4-b52587203765',
  'c6d46bd7-9ced-4fb2-a4a0-ae033e3b612a'
])

const isFigurinhasArea = (id = '', title = '') => figurinhasAreaIds.has(id) || /figurinhas|copa 2026/i.test(title)
const isWrongLightroomAsset = (value = '') => /robo|rob[oô]|lightroom|presets|ribas/i.test(value)
const cleanFigurinhasImage = (value = '') => {
  if (/^(data:image|blob:)/i.test(value) || /member-area-covers/i.test(value)) return value
  if (!value || isWrongLightroomAsset(value)) return defaultClubBanner
  return value
}

const readLocalCustomization = (id: string) => {
  if (!process.client) return {}
  try {
    const raw = localStorage.getItem(localCustomizationKey(id))
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const normalizeCustomization = (customization: Record<string, any> = {}, fallbackTitle = 'Área de membros', fallbackCover = '', forceFigurinhas = false) => {
  const coverFallback = forceFigurinhas ? cleanFigurinhasImage(fallbackCover) : (fallbackCover || defaultClubBanner)
  const bannerImage = forceFigurinhas
    ? cleanFigurinhasImage(customization.home?.banner?.imageUrl || customization.bannerUrl || coverFallback)
    : (customization.home?.banner?.imageUrl || customization.bannerUrl || coverFallback)
  const theme = {
    primaryColor: customization.theme?.primaryColor || customization.primaryColor || '#4f46e5',
    sidebarColor: customization.theme?.sidebarColor || customization.sidebarColor || '#facc15',
    backgroundColor: customization.theme?.backgroundColor || customization.backgroundColor || '#080808',
    textColor: customization.theme?.textColor || customization.textColor || '#ffffff'
  }
  const sidebar = {
    logoUrl: customization.sidebar?.logoUrl || customization.logoUrl || '',
    brandName: customization.sidebar?.brandName || customization.brandName || 'RETRATISTAS DIGITAIS',
    title: customization.sidebar?.title || customization.heroTitle || fallbackTitle,
    collapsed: Boolean(customization.sidebar?.collapsed),
    links: {
      home: customization.sidebar?.links?.home || customization.homeLabel || 'Home',
      instagram: customization.sidebar?.links?.instagram || customization.instagramLabel || 'Instagram',
      support: customization.sidebar?.links?.support || customization.supportLabel || 'Suporte',
      instagramUrl: customization.sidebar?.links?.instagramUrl || 'https://instagram.com',
      supportUrl: customization.sidebar?.links?.supportUrl || 'mailto:suporte@ayrtonborgesonline.com'
    }
  }
  const home = {
    banner: {
      title: customization.home?.banner?.title || customization.heroTitle || fallbackTitle,
      imageUrl: bannerImage,
      visible: customization.home?.banner?.visible ?? (customization.visibleSections ? customization.visibleSections.includes('banner') : true)
    },
    slides: (customization.home?.slides?.length
      ? customization.home.slides
      : [{ id: 'slide-1', title: 'Slide', imageUrl: customization.bannerUrl || coverFallback }]).map((slide: Record<string, any>, index: number) => ({
        ...slide,
        id: slide.id || `slide-${index + 1}`,
        title: slide.title || (index === 0 ? 'Slide' : `Slide ${index + 1}`),
        imageUrl: forceFigurinhas ? cleanFigurinhasImage(slide.imageUrl || customization.bannerUrl || coverFallback) : (slide.imageUrl || customization.bannerUrl || coverFallback)
      })),
    sections: customization.home?.sections?.length
      ? customization.home.sections
      : [{ id: 'modules', type: 'modules', title: customization.modulesTitle || 'Uma seção pode conter módulos', visible: customization.visibleSections ? customization.visibleSections.includes('modules') : true }]
  }

  return {
    ...customization,
    theme,
    sidebar,
    home,
    primaryColor: theme.primaryColor,
    sidebarColor: theme.sidebarColor,
    backgroundColor: theme.backgroundColor,
    textColor: theme.textColor,
    logoUrl: sidebar.logoUrl,
    bannerUrl: home.banner.imageUrl,
    brandName: sidebar.brandName,
    homeLabel: sidebar.links.home,
    instagramLabel: sidebar.links.instagram,
    supportLabel: sidebar.links.support,
    heroTitle: home.banner.title,
    modulesTitle: home.sections.find((section: Record<string, any>) => section.type === 'modules')?.title || 'Uma seção pode conter módulos'
  }
}

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
    if (!supabase) {
      const mock = getMockMemberClub(clubId)
      const customization = normalizeCustomization(readLocalCustomization(clubId), mock.club.title, mock.course.coverUrl || '')
      return {
        ...mock,
        club: {
          ...mock.club,
          title: customization.sidebar?.title || mock.club.title,
          brandName: customization.sidebar?.brandName || mock.club.brandName,
          instagramUrl: customization.sidebar?.links?.instagramUrl || mock.club.instagramUrl,
          supportUrl: customization.sidebar?.links?.supportUrl || mock.club.supportUrl,
          logoUrl: customization.sidebar?.logoUrl || mock.club.logoUrl,
          customization
        },
        course: {
          ...mock.course,
          coverUrl: customization.home?.banner?.imageUrl || mock.course.coverUrl
        }
      }
    }

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

    if (!area) {
      const mock = getMockMemberClub(clubId)
      const customization = normalizeCustomization(readLocalCustomization(clubId), mock.club.title, mock.course.coverUrl || '')
      return {
        ...mock,
        club: { ...mock.club, customization, logoUrl: customization.sidebar?.logoUrl || mock.club.logoUrl },
        course: { ...mock.course, coverUrl: customization.home?.banner?.imageUrl || mock.course.coverUrl }
      }
    }

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
    const forceFigurinhas = isFigurinhasArea(area.id, `${area.title || ''} ${primaryCourse.title || ''} ${fallback.club.title || ''}`)
    const customization = normalizeCustomization(
      { ...(area.customization || {}), ...readLocalCustomization(area.id) },
      forceFigurinhas ? fallback.club.title : (area.title || primaryCourse.title || fallback.club.title),
      forceFigurinhas ? fallback.course.coverUrl || defaultClubBanner : (primaryCourse.cover_url || area.cover_url || ''),
      forceFigurinhas
    )
    const safeModules = forceFigurinhas ? fallback.modules : (modules.length ? modules : fallback.modules)

    return {
      club: {
        id: area.id,
        title: forceFigurinhas ? fallback.club.title : (customization.sidebar?.title || customization.heroTitle || area.title || primaryCourse.title || fallback.club.title),
        subtitle: area.description || '',
        instagramUrl: customization.sidebar?.links?.instagramUrl || area.instagram_url || fallback.club.instagramUrl,
        supportUrl: customization.sidebar?.links?.supportUrl || area.support_url || fallback.club.supportUrl,
        brandName: customization.sidebar?.brandName || customization.brandName || area.brand_name || fallback.club.brandName,
        logoUrl: customization.sidebar?.logoUrl || customization.logoUrl || area.logo_url || '',
        customization
      },
      course: {
        id: forceFigurinhas ? fallback.course.id : primaryCourse.id,
        title: forceFigurinhas ? fallback.course.title : (primaryCourse.title || area.title || fallback.course.title),
        description: primaryCourse.description || area.description || '',
        coverUrl: customization.home?.banner?.imageUrl || customization.bannerUrl || (forceFigurinhas ? fallback.course.coverUrl : primaryCourse.cover_url || area.cover_url || '')
      },
      modules: safeModules
    }
  } catch {
    return getMockMemberClub(clubId)
  }
}
