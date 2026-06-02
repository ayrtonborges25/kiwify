import { getSupabaseClient } from '~/utils/supabase'
import { defaultClubBanner, defaultFigurinhasModuleImage, getMockMemberClub, type MemberClubData, type MemberClubLesson, type MemberClubModule } from '~/data/memberClub'

const byPosition = <T extends { position?: number }>(a: T, b: T) => Number(a.position || 0) - Number(b.position || 0)
const localCustomizationKey = (id: string) => `members-area:${id}:customization`
const figurinhasAreaIds = new Set([
  '1cbe33c8-14d3-4612-81e4-b52587203765',
  'c6d46bd7-9ced-4fb2-a4a0-ae033e3b612a'
])

const isFigurinhasArea = (id = '', title = '') => figurinhasAreaIds.has(id) || /figurinhas|copa 2026/i.test(title)
const blockedMemberContentPattern = /robo|rob[oô]|lightroom|presets|ribas/i
const figurinhasDriveLink = 'https://drive.google.com/drive/folders/1owxb2iB_VVps8W05OqwI8aNjt61ObjjP'
const isCleanMemberAreaUpload = (value = '') => /member-area-covers.*clean-/i.test(value)
const cleanMemberClubImage = (value = '', fallback = '') => {
  if (/^(data:image|blob:)/i.test(value)) return value
  if (isCleanMemberAreaUpload(value)) return value
  if (value === defaultClubBanner || value === defaultFigurinhasModuleImage) return value
  if (!value || blockedMemberContentPattern.test(value)) return fallback
  return fallback
}
const cleanMemberClubText = (value = '', fallback = 'Figurinhas da Copa 2026') => blockedMemberContentPattern.test(value) ? fallback : value
const cleanMemberClubLessonText = (value = '') => {
  if (!value || value.includes('https://drive.google.com/drive...')) return `Baixe todos os arquivos neste link\n${figurinhasDriveLink}`
  return value.replace(/https:\/\/drive\.google\.com\/drive\.\.\./g, figurinhasDriveLink)
}
const resolveMemberClubModuleImage = (row: Record<string, any>, title = '') => {
  const explicitImage = cleanMemberClubImage(row.cover_url || row.image_url || '', '')
  if (explicitImage) return explicitImage
  if (/baixar figurinhas|figurinhas/i.test(title)) return defaultFigurinhasModuleImage
  return defaultFigurinhasModuleImage
}

const readLocalCourseModules = (courseId: string) => {
  if (!process.client) return []
  try {
    const raw = localStorage.getItem(`members-area-course:${courseId}:modules`)
    const modules = raw ? JSON.parse(raw) : []
    return Array.isArray(modules) ? modules : []
  } catch {
    return []
  }
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

const normalizeCustomization = (customization: Record<string, any> = {}, fallbackTitle = 'Área de membros', fallbackCover = '') => {
  const safeFallbackTitle = cleanMemberClubText(fallbackTitle)
  const coverFallback = cleanMemberClubImage(fallbackCover)
  const bannerImage = cleanMemberClubImage(customization.home?.banner?.imageUrl || customization.bannerUrl || coverFallback, coverFallback)
  const theme = {
    primaryColor: customization.theme?.primaryColor || customization.primaryColor || '#4f46e5',
    sidebarColor: customization.theme?.sidebarColor || customization.sidebarColor || '#facc15',
    backgroundColor: customization.theme?.backgroundColor || customization.backgroundColor || '#080808',
    textColor: customization.theme?.textColor || customization.textColor || '#ffffff'
  }
  const sidebar = {
    logoUrl: customization.sidebar?.logoUrl || customization.logoUrl || '',
    brandName: cleanMemberClubText(customization.sidebar?.brandName || customization.brandName || 'RETRATISTAS DIGITAIS', 'RETRATISTAS DIGITAIS'),
    title: cleanMemberClubText(customization.sidebar?.title || customization.heroTitle || safeFallbackTitle),
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
      title: cleanMemberClubText(customization.home?.banner?.title || customization.heroTitle || safeFallbackTitle),
      imageUrl: bannerImage,
      visible: customization.home?.banner?.visible ?? (customization.visibleSections ? customization.visibleSections.includes('banner') : true)
    },
    slides: (customization.home?.slides?.length
      ? customization.home.slides
      : [{ id: 'slide-1', title: 'Slide', imageUrl: customization.bannerUrl || coverFallback }]).map((slide: Record<string, any>, index: number) => ({
        ...slide,
        id: slide.id || `slide-${index + 1}`,
        title: slide.title || (index === 0 ? 'Slide' : `Slide ${index + 1}`),
        imageUrl: cleanMemberClubImage(slide.imageUrl || customization.bannerUrl || coverFallback, coverFallback)
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
    heroTitle: cleanMemberClubText(home.banner.title),
    modulesTitle: home.sections.find((section: Record<string, any>) => section.type === 'modules')?.title || 'Uma seção pode conter módulos'
  }
}

const normalizeLesson = (row: Record<string, any>, moduleId: string, index: number): MemberClubLesson => ({
  id: row.id || `${moduleId}-lesson-${index}`,
  moduleId,
  title: row.title || `Aula ${index + 1}`,
  description: cleanMemberClubLessonText(row.description || row.content || ''),
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
    title: cleanMemberClubText(row.title || `Módulo ${index + 1}`, `Módulo ${index + 1}`),
    description: row.description || '',
    imageUrl: resolveMemberClubModuleImage(row, row.title || ''),
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
      const localModules = readLocalCourseModules(mock.course.id)
      const modules = (localModules.length ? localModules : mock.modules).map((module: Record<string, any>, index: number) => {
        const moduleId = module.id || `module-${index}`
        const lessonRows = Array.isArray(module.contents) ? module.contents : (Array.isArray(module.lessons) ? module.lessons : [])
        return {
          id: moduleId,
          title: cleanMemberClubText(module.title || `Módulo ${index + 1}`, `Módulo ${index + 1}`),
          description: module.description || '',
          imageUrl: cleanMemberClubImage(module.imageUrl || module.image_url || '', '') || (module.title && /baixar figurinhas|figurinhas/i.test(module.title) ? defaultFigurinhasModuleImage : ''),
          position: Number(module.position ?? index + 1),
          status: String(module.status || 'Publicado').toLowerCase().includes('bloque') ? 'locked' : 'available',
          lessons: lessonRows.map((lesson: Record<string, any>, lessonIndex: number) => ({
            id: lesson.id || `${moduleId}-lesson-${lessonIndex}`,
            moduleId,
            title: cleanMemberClubText(lesson.title || `Aula ${lessonIndex + 1}`, `Aula ${lessonIndex + 1}`),
            description: cleanMemberClubLessonText(lesson.content || lesson.description || ''),
            duration: lesson.duration || '',
            position: Number(lesson.position || lessonIndex + 1),
            status: String(lesson.status || 'Publicado').toLowerCase().includes('bloque') ? 'locked' : 'available'
          }))
        }
      })
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
        },
        modules: modules.length ? modules : mock.modules
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
      forceFigurinhas ? fallback.club.title : cleanMemberClubText(area.title || primaryCourse.title || fallback.club.title),
      primaryCourse.cover_url || area.cover_url || fallback.course.coverUrl || defaultClubBanner
    )
    const safeModules = (modules.length ? modules : fallback.modules).map((module) => ({
      ...module,
      title: cleanMemberClubText(module.title, 'Módulo'),
      imageUrl: cleanMemberClubImage(module.imageUrl || defaultFigurinhasModuleImage)
    }))

    return {
      club: {
        id: area.id,
        title: forceFigurinhas ? fallback.club.title : cleanMemberClubText(customization.sidebar?.title || customization.heroTitle || area.title || primaryCourse.title || fallback.club.title),
        subtitle: area.description || '',
        instagramUrl: customization.sidebar?.links?.instagramUrl || area.instagram_url || fallback.club.instagramUrl,
        supportUrl: customization.sidebar?.links?.supportUrl || area.support_url || fallback.club.supportUrl,
        brandName: cleanMemberClubText(customization.sidebar?.brandName || customization.brandName || area.brand_name || fallback.club.brandName, 'RETRATISTAS DIGITAIS'),
        logoUrl: customization.sidebar?.logoUrl || customization.logoUrl || area.logo_url || '',
        customization
      },
      course: {
        id: forceFigurinhas ? fallback.course.id : primaryCourse.id,
        title: forceFigurinhas ? fallback.course.title : cleanMemberClubText(primaryCourse.title || area.title || fallback.course.title),
        description: primaryCourse.description || area.description || '',
        coverUrl: cleanMemberClubImage(customization.home?.banner?.imageUrl || customization.bannerUrl || primaryCourse.cover_url || area.cover_url || fallback.course.coverUrl || defaultClubBanner)
      },
      modules: safeModules
    }
  } catch {
    return getMockMemberClub(clubId)
  }
}
