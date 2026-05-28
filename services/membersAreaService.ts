import {
  membersAreaModules as mockMembersAreaModules,
  membersAreas as mockMembersAreas,
  type MembersArea,
  type MembersAreaCourse,
  type MembersAreaCustomization,
  type MembersAreaGroup,
  type MembersAreaLesson,
  type MembersAreaLessonAttachment,
  type MembersAreaModule,
  type MembersAreaSettings,
  type MembersAreaStudent
} from '~/data/membersArea'
import { getSupabaseClient } from '~/utils/supabase'

export type CreateMembersAreaPayload = Partial<Omit<MembersArea, 'id'>>
export type UpdateMembersAreaPayload = Partial<Omit<MembersArea, 'id'>>
export type CreateMembersAreaModulePayload = Partial<MembersAreaModule> & {
  membersAreaId?: string
  courseId?: string
  description?: string
}
export type MembersAreaLessonPayload = Partial<Omit<MembersAreaLesson, 'id'>> & {
  id?: string
  courseId?: string
  moduleId: string
}

const membersAreasStore: MembersArea[] = [...mockMembersAreas]
const membersAreaModulesStore: MembersAreaModule[] = [...mockMembersAreaModules]
const defaultSettings: MembersAreaSettings = {
  type: 'complete',
  commentsEnabled: false
}
const defaultClubBanner = ''
const defaultFigurinhasModuleImage = '/figurinhas-module-thumb.jpg'
const figurinhasDriveLink = 'https://drive.google.com/drive/folders/1owxb2iB_VVps8W05OqwI8aNjt61ObjjP'
const defaultCustomization: MembersAreaCustomization = {
  theme: {
    primaryColor: '#4f46e5',
    sidebarColor: '#facc15',
    backgroundColor: '#080808',
    textColor: '#ffffff'
  },
  sidebar: {
    logoUrl: '',
    brandName: 'RETRATISTAS DIGITAIS',
    title: 'Figurinhas da Copa 2026',
    collapsed: false,
    links: {
      home: 'Home',
      instagram: 'Instagram',
      support: 'Suporte',
      instagramUrl: 'https://instagram.com',
      supportUrl: 'mailto:suporte@ayrtonborgesonline.com'
    }
  },
  home: {
    banner: {
      title: 'Figurinhas da Copa 2026',
      imageUrl: defaultClubBanner,
      visible: true
    },
    slides: [
      { id: 'slide-1', title: 'Slide', imageUrl: defaultClubBanner }
    ],
    sections: [
      { id: 'modules', type: 'modules', title: 'Uma seção pode conter módulos', visible: true }
    ]
  },
  menu: {},
  login: {},
  settings: {},
  primaryColor: '#4f46e5',
  sidebarColor: '#facc15',
  backgroundColor: '#080808',
  textColor: '#ffffff',
  brandName: 'RETRATISTAS DIGITAIS',
  homeLabel: 'Home',
  instagramLabel: 'Instagram',
  supportLabel: 'Suporte',
  heroTitle: 'Figurinhas da Copa 2026',
  modulesTitle: 'Uma seção pode conter módulos',
  visibleSections: ['banner', 'modules']
}
const mockGroupsStore: Record<string, MembersAreaGroup[]> = {}
const blockedMemberContentPattern = /robo|rob[oô]|lightroom|presets|ribas/i
const isCleanMemberAreaUpload = (value = '') => /member-area-covers.*clean-/i.test(value)
const cleanMembersAreaImage = (value = '') => {
  if (/^(data:image|blob:)/i.test(value) || isCleanMemberAreaUpload(value)) return value
  if (value === defaultClubBanner || value === defaultFigurinhasModuleImage) return value
  if (!value || blockedMemberContentPattern.test(value)) return ''
  return ''
}
const cleanMembersAreaText = (value = '', fallback = 'Figurinhas da Copa 2026') => blockedMemberContentPattern.test(value) ? fallback : value
const cleanMembersAreaLessonText = (value = '') => {
  if (!value || value.includes('https://drive.google.com/drive...')) return `Baixe todos os arquivos neste link\n${figurinhasDriveLink}`
  return value.replace(/https:\/\/drive\.google\.com\/drive\.\.\./g, figurinhasDriveLink)
}
const resolveMembersAreaModuleImage = (row: Record<string, any>, title = '') => {
  if (/baixar figurinhas|figurinhas/i.test(title)) return defaultFigurinhasModuleImage
  return cleanMembersAreaImage(row.image_url || defaultFigurinhasModuleImage) || defaultFigurinhasModuleImage
}

const normalizeCustomization = (customization: MembersAreaCustomization = {}, areaName = 'Figurinhas da Copa 2026', coverUrl = ''): MembersAreaCustomization => {
  const safeAreaName = cleanMembersAreaText(areaName)
  const coverFallback = cleanMembersAreaImage(coverUrl)
  const theme = {
    ...defaultCustomization.theme,
    ...(customization.theme || {}),
    primaryColor: customization.theme?.primaryColor || customization.primaryColor || defaultCustomization.primaryColor,
    sidebarColor: customization.theme?.sidebarColor || customization.sidebarColor || defaultCustomization.sidebarColor,
    backgroundColor: customization.theme?.backgroundColor || customization.backgroundColor || defaultCustomization.backgroundColor,
    textColor: customization.theme?.textColor || customization.textColor || defaultCustomization.textColor
  }

  const sidebar = {
    ...defaultCustomization.sidebar,
    ...(customization.sidebar || {}),
    logoUrl: customization.sidebar?.logoUrl || customization.logoUrl || '',
    brandName: cleanMembersAreaText(customization.sidebar?.brandName || customization.brandName || defaultCustomization.brandName || 'RETRATISTAS DIGITAIS', 'RETRATISTAS DIGITAIS'),
    title: cleanMembersAreaText(customization.sidebar?.title || customization.heroTitle || safeAreaName),
    links: {
      ...defaultCustomization.sidebar?.links,
      ...(customization.sidebar?.links || {}),
      home: customization.sidebar?.links?.home || customization.homeLabel || defaultCustomization.homeLabel,
      instagram: customization.sidebar?.links?.instagram || customization.instagramLabel || defaultCustomization.instagramLabel,
      support: customization.sidebar?.links?.support || customization.supportLabel || defaultCustomization.supportLabel
    }
  }

  const sections = customization.home?.sections?.length
    ? customization.home.sections
    : [{ id: 'modules', type: 'modules', title: customization.modulesTitle || defaultCustomization.modulesTitle || 'Uma seção pode conter módulos', visible: customization.visibleSections ? customization.visibleSections.includes('modules') : true }]

  const home = {
    ...defaultCustomization.home,
    ...(customization.home || {}),
    banner: {
      ...defaultCustomization.home?.banner,
      ...(customization.home?.banner || {}),
      title: cleanMembersAreaText(customization.home?.banner?.title || customization.heroTitle || safeAreaName),
      imageUrl: cleanMembersAreaImage(customization.home?.banner?.imageUrl || customization.bannerUrl || coverFallback),
      visible: customization.home?.banner?.visible ?? (customization.visibleSections ? customization.visibleSections.includes('banner') : true)
    },
    slides: (customization.home?.slides?.length
      ? customization.home.slides
      : [{ id: 'slide-1', title: 'Slide', imageUrl: customization.bannerUrl || coverFallback }]).map((slide, index) => ({
        ...slide,
        id: slide.id || `slide-${index + 1}`,
        title: slide.title || (index === 0 ? 'Slide' : `Slide ${index + 1}`),
        imageUrl: cleanMembersAreaImage(slide.imageUrl || customization.bannerUrl || coverFallback)
      })),
    sections
  }

  return {
    ...defaultCustomization,
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
    brandName: cleanMembersAreaText(sidebar.brandName, 'RETRATISTAS DIGITAIS'),
    homeLabel: sidebar.links.home,
    instagramLabel: sidebar.links.instagram,
    supportLabel: sidebar.links.support,
    heroTitle: cleanMembersAreaText(home.banner.title),
    modulesTitle: sections.find((section) => section.type === 'modules')?.title || defaultCustomization.modulesTitle,
    visibleSections: [
      ...(home.banner.visible ? ['banner'] : []),
      ...sections.filter((section) => section.visible !== false).map((section) => section.type)
    ]
  }
}

const localStoreKey = (id: string, key: 'settings' | 'customization' | 'groups') => `members-area:${id}:${key}`
const localCourseModulesKey = (courseId: string) => `members-area-course:${courseId}:modules`

const readLocalValue = <T>(id: string, key: 'settings' | 'customization' | 'groups', fallback: T): T => {
  if (!process.client) return fallback
  try {
    const raw = localStorage.getItem(localStoreKey(id, key))
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
    return { ...(fallback as any), ...parsed }
  } catch {
    return fallback
  }
}

const writeLocalValue = <T>(id: string, key: 'settings' | 'customization' | 'groups', value: T) => {
  if (!process.client) return
  localStorage.setItem(localStoreKey(id, key), JSON.stringify(value))
}

const createMockId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `mock-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const defaultLesson = (moduleId: string, courseId?: string): MembersAreaLesson => ({
  id: 'welcome-lesson',
  courseId,
  moduleId,
  title: 'BAIXE SEUS ARQUIVOS AQUI',
  description: '',
  content: `Baixe todos os arquivos neste link\n${figurinhasDriveLink}`,
  videoUrl: '',
  thumbnailUrl: '',
  attachments: [],
  releaseType: 'immediate',
  releaseDays: 0,
  releaseDate: '',
  durationLimited: false,
  position: 1,
  status: 'Publicado'
})

const defaultCourseModules = (courseId: string): MembersAreaModule[] => [{
  id: 'welcome',
  courseId,
  title: 'Baixar figurinhas',
  lessons: 1,
  status: 'Publicado',
  imageUrl: defaultFigurinhasModuleImage,
  position: 1,
  contents: [defaultLesson('welcome', courseId)]
}]

const readCourseModulesLocal = (courseId: string): MembersAreaModule[] => {
  if (!process.client) return defaultCourseModules(courseId)
  try {
    const raw = localStorage.getItem(localCourseModulesKey(courseId))
    if (!raw) return defaultCourseModules(courseId)
    const modules = JSON.parse(raw)
    return Array.isArray(modules) && modules.length ? modules : defaultCourseModules(courseId)
  } catch {
    return defaultCourseModules(courseId)
  }
}

const writeCourseModulesLocal = (courseId: string, modules: MembersAreaModule[]) => {
  if (!process.client) return
  localStorage.setItem(localCourseModulesKey(courseId), JSON.stringify(modules))
}

const mapMembersAreaFromSupabase = (row: Record<string, any>): MembersArea => ({
  id: row.id,
  name: cleanMembersAreaText(row.courses?.[0]?.title || row.title || 'Área de membros'),
  courseId: row.courses?.[0]?.id || row.course_id || '',
  productId: row.product_id || row.courses?.[0]?.product_id || undefined,
  students: row.students || 0,
  coverUrl: cleanMembersAreaImage(row.courses?.[0]?.cover_url || row.cover_url || ''),
  settings: { ...defaultSettings, ...(row.settings || {}) },
  customization: normalizeCustomization(
    { ...(row.customization || {}), ...readLocalValue(row.id, 'customization', {}) },
    cleanMembersAreaText(row.courses?.[0]?.title || row.title || 'Área de membros'),
    row.courses?.[0]?.cover_url || row.cover_url || ''
  )
})

const mapCourseFromSupabase = (row: Record<string, any>): MembersAreaCourse => ({
  id: row.id,
  title: cleanMembersAreaText(row.title || 'Curso', 'Curso'),
  description: row.description || '',
  productId: row.product_id || undefined,
  coverUrl: cleanMembersAreaImage(row.cover_url || '')
})

const mapLessonFromSupabase = (row: Record<string, any>, moduleId: string, index: number): MembersAreaLesson => ({
  id: row.id || createMockId(),
  courseId: row.course_id || undefined,
  moduleId,
  title: row.title || 'Novo conteúdo',
  description: row.description || '',
  content: cleanMembersAreaLessonText(row.content || row.description || ''),
  videoUrl: row.video_url || '',
  thumbnailUrl: row.thumbnail_url || '',
  attachments: Array.isArray(row.attachments) ? row.attachments : [],
  releaseType: row.release_type || 'immediate',
  releaseDays: Number(row.release_days || 0),
  releaseDate: row.release_date || '',
  durationLimited: Boolean(row.duration_limited),
  position: Number(row.position || index + 1),
  status: row.status || 'Publicado'
})

const mapModuleFromSupabase = (row: Record<string, any>): MembersAreaModule => ({
  id: row.id,
  courseId: row.course_id,
  title: cleanMembersAreaText(row.title || 'Modulo', 'Modulo'),
  lessons: row.lessons?.length || 0,
  status: row.status || 'Publicado',
  imageUrl: resolveMembersAreaModuleImage(row, row.title || ''),
  position: Number(row.position || 0),
  contents: (row.lessons || []).map((lesson: Record<string, any>, index: number) => mapLessonFromSupabase(lesson, row.id, index))
})

const fallbackAreas = () => membersAreasStore
const fallbackModules = () => membersAreaModulesStore

export const getMembersAreasSnapshot = () => getSupabaseClient() ? [] : membersAreasStore

export const getMembersAreaModulesSnapshot = () => getSupabaseClient() ? [] : membersAreaModulesStore

export const listMembersAreas = async () => {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) return fallbackAreas()

    const { data, error } = await supabase
      .from('members_areas')
      .select('*, courses(id, title, product_id, cover_url)')
      .order('created_at', { ascending: false })

    if (error) return fallbackAreas()

    const linkedAreas = data.filter((area) => area.courses?.some((course: Record<string, any>) => course.product_id))
    return (linkedAreas.length ? linkedAreas : data).map(mapMembersAreaFromSupabase)
  } catch {
    return fallbackAreas()
  }
}

export const listMembersAreaModules = async (courseId?: string) => {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) return fallbackModules()

    let query = supabase
      .from('modules')
      .select('*, lessons(id,course_id,module_id,title,description,content,video_url,thumbnail_url,attachments,release_type,release_days,release_date,duration_limited,position,status)')
      .order('position', { ascending: true })

    if (courseId) query = query.eq('course_id', courseId)

    const { data, error } = await query

    if (error) return fallbackModules()

    return data.map(mapModuleFromSupabase)
  } catch {
    return fallbackModules()
  }
}

export const listCourseModules = async (courseId: string): Promise<MembersAreaModule[]> => {
  const fallback = readCourseModulesLocal(courseId)

  try {
    const supabase = getSupabaseClient()
    if (!supabase || !courseId) return fallback

    const { data, error } = await supabase
      .from('modules')
      .select('*, lessons(id,course_id,module_id,title,description,content,video_url,thumbnail_url,attachments,release_type,release_days,release_date,duration_limited,position,status)')
      .eq('course_id', courseId)
      .order('position', { ascending: true })

    if (error || !data?.length) return fallback

    const modules = data.map(mapModuleFromSupabase).map((module, index) => ({
      ...module,
      position: Number(module.position || index + 1),
      contents: module.contents?.length ? module.contents : []
    }))
    writeCourseModulesLocal(courseId, modules)
    return modules
  } catch {
    return fallback
  }
}

export const listMembersAreaCourses = async (membersAreaId: string): Promise<MembersAreaCourse[]> => {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      const area = membersAreasStore.find((item) => item.id === membersAreaId)
      return area ? [{ id: area.courseId, title: area.name, productId: area.productId, coverUrl: area.coverUrl }] : []
    }

    const { data, error } = await supabase
      .from('courses')
      .select('id,title,description,product_id,cover_url')
      .eq('members_area_id', membersAreaId)
      .order('created_at', { ascending: true })

    if (error) return []
    return (data || []).map(mapCourseFromSupabase)
  } catch {
    return []
  }
}

export const listMembersAreaStudents = async (membersAreaId: string): Promise<MembersAreaStudent[]> => {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return [
        { id: 'student-1', name: 'Danielle Dias Ferreira dos santos', email: 'dani_dfs88@hotmail.com', lastAccess: '22/05/2026 18:44', progress: 0 },
        { id: 'student-2', name: 'RETRATISTAS DIGITAIS', email: 'ayrtonborgesfotografias@hotmail.com', lastAccess: '21/05/2026 11:11', progress: 100, isCurrentUser: true },
        { id: 'student-3', name: 'Retratistas Digitais', email: 'henrique@email.com', lastAccess: '20/05/2026 09:20', progress: 0 }
      ]
    }

    const { data: area } = await supabase
      .from('members_areas')
      .select('id,product_id,courses(id,product_id)')
      .eq('id', membersAreaId)
      .maybeSingle()

    const productIds = new Set<string>()
    if (area?.product_id) productIds.add(area.product_id)
    ;(area?.courses || []).forEach((course: Record<string, any>) => {
      if (course.product_id) productIds.add(course.product_id)
    })

    if (!productIds.size) return []

    const { data, error } = await supabase
      .from('sales')
      .select('id,customer_name,customer_email,status,created_at,paid_at,product_id')
      .in('product_id', [...productIds])
      .in('status', ['approved', 'Pago'])
      .order('created_at', { ascending: false })

    if (error) return []

    return (data || []).map((row: Record<string, any>, index: number) => ({
      id: row.id,
      name: row.customer_name || row.customer_email || `Aluno ${index + 1}`,
      email: row.customer_email || '',
      lastAccess: row.paid_at
        ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(row.paid_at))
        : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(row.created_at)),
      progress: index === 0 ? 100 : 0,
      isCurrentUser: index === 0
    }))
  } catch {
    return []
  }
}

const defaultGroups = (membersAreaId: string): MembersAreaGroup[] => mockGroupsStore[membersAreaId] || [
  { id: 'default', name: 'Grupo A', students: 3, isDefault: true }
]

export const listMembersAreaGroups = async (membersAreaId: string): Promise<MembersAreaGroup[]> => {
  const fallback = readLocalValue(membersAreaId, 'groups', defaultGroups(membersAreaId))

  try {
    const supabase = getSupabaseClient()
    if (!supabase) return fallback

    const { data, error } = await supabase
      .from('members_area_groups')
      .select('id,name,students,is_default')
      .eq('members_area_id', membersAreaId)
      .order('created_at', { ascending: true })

    if (error || !data?.length) return fallback

    return data.map((row: Record<string, any>) => ({
      id: row.id,
      name: row.name || 'Grupo',
      students: Number(row.students || 0),
      isDefault: Boolean(row.is_default)
    }))
  } catch {
    return fallback
  }
}

export const saveMembersAreaGroups = async (membersAreaId: string, groups: MembersAreaGroup[]) => {
  mockGroupsStore[membersAreaId] = groups
  writeLocalValue(membersAreaId, 'groups', groups)

  try {
    const supabase = getSupabaseClient()
    if (!supabase) return groups

    const { data: existing } = await supabase
      .from('members_area_groups')
      .select('id')
      .eq('members_area_id', membersAreaId)

    const nextIds = new Set(groups.map((group) => group.id))
    const staleIds = (existing || [])
      .map((group: Record<string, any>) => group.id)
      .filter((id: string) => !nextIds.has(id))

    if (staleIds.length) {
      await supabase
        .from('members_area_groups')
        .delete()
        .in('id', staleIds)
        .eq('members_area_id', membersAreaId)
    }

    const payload = groups.map((group) => ({
      id: group.id,
      members_area_id: membersAreaId,
      name: group.name,
      students: Number(group.students || 0),
      is_default: Boolean(group.isDefault)
    }))

    if (payload.length) {
      const { data, error } = await supabase
        .from('members_area_groups')
        .upsert(payload, { onConflict: 'id' })
        .select('id,name,students,is_default')
        .order('created_at', { ascending: true })

      if (!error && data) {
        return data.map((row: Record<string, any>) => ({
          id: row.id,
          name: row.name || 'Grupo',
          students: Number(row.students || 0),
          isDefault: Boolean(row.is_default)
        }))
      }
    }
  } catch {
    // Mantem fallback local quando a migration ainda nao foi aplicada.
  }

  return groups
}

export const saveMembersAreaSettings = async (membersAreaId: string, settings: MembersAreaSettings) => {
  const normalized = { ...defaultSettings, ...settings }
  writeLocalValue(membersAreaId, 'settings', normalized)

  try {
    const supabase = getSupabaseClient()
    if (supabase) {
      const { data, error } = await supabase
        .from('members_areas')
        .update({ settings: normalized })
        .eq('id', membersAreaId)
        .select('*, courses(id, title, product_id, cover_url)')
        .maybeSingle()

      if (!error && data) return mapMembersAreaFromSupabase(data)
    }
  } catch {
    // fallback abaixo
  }

  const area = membersAreasStore.find((item) => item.id === membersAreaId)
  if (area) area.settings = normalized
  return area
}

export const saveMembersAreaCustomization = async (membersAreaId: string, customization: MembersAreaCustomization) => {
  const normalized = normalizeCustomization(customization, customization.heroTitle || customization.home?.banner?.title || 'Área de membros', customization.bannerUrl || customization.home?.banner?.imageUrl || '')
  writeLocalValue(membersAreaId, 'customization', normalized)

  try {
    const supabase = getSupabaseClient()
    if (supabase) {
      const { data, error } = await supabase
        .from('members_areas')
        .update({ customization: normalized, cover_url: normalized.bannerUrl || undefined })
        .eq('id', membersAreaId)
        .select('*, courses(id, title, product_id, cover_url)')
        .maybeSingle()

      if (!error && data) return mapMembersAreaFromSupabase(data)
    }
  } catch {
    // fallback abaixo
  }

  const area = membersAreasStore.find((item) => item.id === membersAreaId)
  if (area) {
    area.customization = normalized
    area.coverUrl = normalized.bannerUrl || area.coverUrl
  }
  return area
}

export const getMembersAreaById = async (id: string) => {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) return membersAreasStore.find((area) => area.id === id)

    const { data, error } = await supabase
      .from('members_areas')
      .select('*, courses(id, title, product_id, cover_url)')
      .eq('id', id)
      .maybeSingle()

    if (error) return membersAreasStore.find((area) => area.id === id)
    if (!data) return undefined

    return mapMembersAreaFromSupabase(data)
  } catch {
    return membersAreasStore.find((area) => area.id === id)
  }
}

export const createMembersArea = async (payload: CreateMembersAreaPayload = {}) => {
  try {
    const supabase = getSupabaseClient()
    if (supabase) {
      const { data, error } = await supabase
        .from('members_areas')
        .insert({
          title: payload.name ?? 'Nova escola',
          students: payload.students ?? 0,
          cover_url: payload.coverUrl,
          settings: payload.settings || defaultSettings,
          customization: payload.customization || defaultCustomization
        })
        .select('*, courses(id)')
        .single()

      if (!error && data) return mapMembersAreaFromSupabase(data)
    }
  } catch {
    // fallback abaixo
  }

  const membersArea: MembersArea = {
    id: createMockId(),
    name: payload.name ?? 'Nova escola',
    courseId: payload.courseId ?? createMockId(),
    students: payload.students ?? 0,
    coverUrl: payload.coverUrl
  }

  membersAreasStore.unshift(membersArea)
  return membersArea
}

export const updateMembersArea = async (id: string, payload: UpdateMembersAreaPayload = {}) => {
  try {
    const supabase = getSupabaseClient()
    if (supabase) {
      const { data, error } = await supabase
        .from('members_areas')
        .update({
          title: payload.name,
          students: payload.students,
          cover_url: payload.coverUrl,
          settings: payload.settings,
          customization: payload.customization
        })
        .eq('id', id)
        .select('*, courses(id)')
        .maybeSingle()

      if (!error && data) return mapMembersAreaFromSupabase(data)
    }
  } catch {
    // fallback abaixo
  }

  const area = membersAreasStore.find((item) => item.id === id)
  if (!area) return undefined

  Object.assign(area, payload)
  return area
}

export const deleteMembersArea = async (id: string) => {
  try {
    const supabase = getSupabaseClient()
    if (supabase) {
      const { error } = await supabase.from('members_areas').delete().eq('id', id)
      if (!error) return true
    }
  } catch {
    // fallback abaixo
  }

  const index = membersAreasStore.findIndex((area) => area.id === id)
  if (index === -1) return false

  membersAreasStore.splice(index, 1)
  return true
}

export const deleteCourseAndMaybeMembersArea = async (payload: { courseId?: string; membersAreaId?: string } = {}) => {
  const { courseId, membersAreaId } = payload

  try {
    const supabase = getSupabaseClient()
    if (supabase) {
      if (courseId) {
        await supabase.from('courses').delete().eq('id', courseId)
      }

      if (membersAreaId) {
        const { count, error } = await supabase
          .from('courses')
          .select('id', { count: 'exact', head: true })
          .eq('members_area_id', membersAreaId)

        if (!error && Number(count || 0) === 0) {
          await supabase.from('members_areas').delete().eq('id', membersAreaId)
        }
      }

      return true
    }
  } catch {
    // fallback abaixo
  }

  if (!membersAreaId) return false

  const area = membersAreasStore.find((item) => item.id === membersAreaId)
  const shouldDeleteArea = !area || !courseId || area.courseId === courseId
  if (!shouldDeleteArea) return true

  const index = membersAreasStore.findIndex((item) => item.id === membersAreaId)
  if (index >= 0) membersAreasStore.splice(index, 1)
  return true
}

export const saveCourseModules = async (courseId: string, modules: MembersAreaModule[]) => {
  const normalized = modules.map((module, moduleIndex) => ({
    ...module,
    id: module.id || createMockId(),
    courseId,
    position: module.position || moduleIndex + 1,
    lessons: module.contents?.length || module.lessons || 0,
    contents: (module.contents || []).map((lesson, lessonIndex) => ({
      ...lesson,
      id: lesson.id || createMockId(),
      courseId,
      moduleId: module.id || lesson.moduleId || '',
      position: lesson.position || lessonIndex + 1,
      releaseType: lesson.releaseType || 'immediate',
      attachments: lesson.attachments || []
    }))
  }))

  writeCourseModulesLocal(courseId, normalized)
  return normalized
}

export const createModule = async (courseId: string, payload: Partial<MembersAreaModule> = {}) => {
  const existing = await listCourseModules(courseId)
  const module: MembersAreaModule = {
    id: createMockId(),
    courseId,
    title: payload.title || 'Novo módulo',
    lessons: 0,
    status: payload.status || 'Publicado',
    imageUrl: payload.imageUrl || '',
    position: existing.length + 1,
    contents: []
  }

  try {
    const supabase = getSupabaseClient()
    if (supabase) {
      const { data, error } = await supabase
        .from('modules')
        .insert({
          course_id: courseId,
          title: module.title,
          image_url: module.imageUrl,
          status: module.status,
          position: module.position
        })
        .select('id,course_id,title,position,status')
        .single()

      if (!error && data) {
        module.id = data.id
        module.courseId = data.course_id
        module.position = data.position
        module.status = data.status
      }
    }
  } catch {
    // Mantem persistencia local.
  }

  const next = await saveCourseModules(courseId, [...existing, module])
  return next.find((item) => item.id === module.id) || module
}

export const updateModule = async (courseId: string, moduleId: string, payload: Partial<MembersAreaModule> = {}) => {
  const existing = await listCourseModules(courseId)
  const next = existing.map((module) => module.id === moduleId
    ? { ...module, ...payload, id: module.id, courseId, lessons: payload.contents?.length ?? module.contents?.length ?? module.lessons }
    : module)

  try {
    const supabase = getSupabaseClient()
    if (supabase) {
      await supabase
        .from('modules')
        .update({
          title: payload.title,
          image_url: payload.imageUrl,
          status: payload.status,
          position: payload.position
        })
        .eq('id', moduleId)
    }
  } catch {
    // Mantem persistencia local.
  }

  await saveCourseModules(courseId, next)
  return next.find((module) => module.id === moduleId)
}

export const deleteModule = async (courseId: string, moduleId: string) => {
  const existing = await listCourseModules(courseId)
  const next = existing.filter((module) => module.id !== moduleId).map((module, index) => ({ ...module, position: index + 1 }))

  try {
    const supabase = getSupabaseClient()
    if (supabase) await supabase.from('modules').delete().eq('id', moduleId)
  } catch {
    // Mantem persistencia local.
  }

  await saveCourseModules(courseId, next)
  return next
}

export const saveLesson = async (courseId: string, payload: MembersAreaLessonPayload) => {
  const modules = await listCourseModules(courseId)
  const module = modules.find((item) => item.id === payload.moduleId)
  if (!module) return undefined

  const existingLessons = module.contents || []
  const isNew = !payload.id || !existingLessons.some((lesson) => lesson.id === payload.id)
  const lesson: MembersAreaLesson = {
    id: payload.id || createMockId(),
    courseId,
    moduleId: payload.moduleId,
    title: payload.title || 'Novo conteúdo',
    description: payload.description || '',
    content: payload.content || '',
    videoUrl: payload.videoUrl || '',
    thumbnailUrl: payload.thumbnailUrl || '',
    attachments: payload.attachments || [],
    releaseType: payload.releaseType || 'immediate',
    releaseDays: Number(payload.releaseDays || 0),
    releaseDate: payload.releaseDate || '',
    durationLimited: Boolean(payload.durationLimited),
    position: payload.position || existingLessons.length + 1,
    status: payload.status || 'Publicado'
  }

  try {
    const supabase = getSupabaseClient()
    if (supabase) {
      const dbPayload = {
        id: lesson.id,
        course_id: courseId,
        module_id: lesson.moduleId,
        title: lesson.title,
        description: lesson.description,
        content: lesson.content,
        video_url: lesson.videoUrl,
        thumbnail_url: lesson.thumbnailUrl,
        attachments: lesson.attachments,
        release_type: lesson.releaseType,
        release_days: lesson.releaseDays,
        release_date: lesson.releaseDate || null,
        duration_limited: lesson.durationLimited,
        position: lesson.position,
        status: lesson.status
      }
      const { data, error } = await supabase
        .from('lessons')
        .upsert(dbPayload, { onConflict: 'id' })
        .select('id')
        .single()
      if (!error && data?.id) lesson.id = data.id
    }
  } catch {
    // Mantem persistencia local.
  }

  const next = modules.map((item) => {
    if (item.id !== payload.moduleId) return item
    const contents = isNew
      ? [...existingLessons, lesson]
      : existingLessons.map((current) => current.id === lesson.id ? lesson : current)
    return { ...item, contents, lessons: contents.length }
  })

  await saveCourseModules(courseId, next)
  return lesson
}

export const deleteLesson = async (courseId: string, moduleId: string, lessonId: string) => {
  const modules = await listCourseModules(courseId)
  const next = modules.map((module) => {
    if (module.id !== moduleId) return module
    const contents = (module.contents || [])
      .filter((lesson) => lesson.id !== lessonId)
      .map((lesson, index) => ({ ...lesson, position: index + 1 }))
    return { ...module, contents, lessons: contents.length }
  })

  try {
    const supabase = getSupabaseClient()
    if (supabase) await supabase.from('lessons').delete().eq('id', lessonId)
  } catch {
    // Mantem persistencia local.
  }

  await saveCourseModules(courseId, next)
  return next
}

export const createCourse = async (payload: CreateMembersAreaModulePayload = {}) => {
  try {
    const supabase = getSupabaseClient()
    if (supabase && payload.membersAreaId) {
      const { data, error } = await supabase
        .from('courses')
        .insert({
          members_area_id: payload.membersAreaId,
          title: payload.title ?? 'Novo curso',
          description: payload.description ?? ''
        })
        .select('*')
        .single()

      if (!error && data) {
        return {
          title: data.title || 'Novo curso',
          lessons: 0,
          status: 'Rascunho'
        }
      }
    }
  } catch {
    // fallback abaixo
  }

  const module: MembersAreaModule = {
    title: payload.title ?? 'Novo curso',
    lessons: payload.lessons ?? 0,
    status: payload.status ?? 'Rascunho'
  }

  membersAreaModulesStore.unshift(module)
  return module
}

export const importCourse = async (payload: CreateMembersAreaModulePayload = {}) => {
  return createCourse({
    ...payload,
    title: payload.title ?? 'Curso importado',
    lessons: payload.lessons ?? 0,
    status: payload.status ?? 'Importado'
  })
}
