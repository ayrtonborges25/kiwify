import {
  membersAreaModules as mockMembersAreaModules,
  membersAreas as mockMembersAreas,
  type MembersArea,
  type MembersAreaCourse,
  type MembersAreaCustomization,
  type MembersAreaGroup,
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

const membersAreasStore: MembersArea[] = [...mockMembersAreas]
const membersAreaModulesStore: MembersAreaModule[] = [...mockMembersAreaModules]
const defaultSettings: MembersAreaSettings = {
  type: 'complete',
  commentsEnabled: false
}
const defaultClubBanner = 'https://aws-assets.kiwify.com.br/Qlf7xYHJBhIz7k6/img_0_Design-sem-nome_c4f6eff966f84e6aa1cc65d4b63d7e3a.png'
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
const isFigurinhasArea = (areaName = '') => /figurinhas|copa 2026/i.test(areaName)
const cleanFigurinhasImage = (value = '') => {
  if (/^(data:image|blob:)/i.test(value) || /member-area-covers/i.test(value)) return value
  if (!value || /robo|rob[oô]|lightroom|presets|ribas/i.test(value)) return defaultClubBanner
  return value
}

const normalizeCustomization = (customization: MembersAreaCustomization = {}, areaName = 'Figurinhas da Copa 2026', coverUrl = ''): MembersAreaCustomization => {
  const forceFigurinhas = isFigurinhasArea(areaName)
  const coverFallback = forceFigurinhas ? cleanFigurinhasImage(coverUrl) : (coverUrl || defaultClubBanner)
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
    brandName: customization.sidebar?.brandName || customization.brandName || defaultCustomization.brandName,
    title: customization.sidebar?.title || customization.heroTitle || areaName,
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
      title: customization.home?.banner?.title || customization.heroTitle || areaName,
      imageUrl: forceFigurinhas ? cleanFigurinhasImage(customization.home?.banner?.imageUrl || customization.bannerUrl || coverFallback) : (customization.home?.banner?.imageUrl || customization.bannerUrl || coverFallback),
      visible: customization.home?.banner?.visible ?? (customization.visibleSections ? customization.visibleSections.includes('banner') : true)
    },
    slides: (customization.home?.slides?.length
      ? customization.home.slides
      : [{ id: 'slide-1', title: 'Slide', imageUrl: customization.bannerUrl || coverFallback }]).map((slide, index) => ({
        ...slide,
        id: slide.id || `slide-${index + 1}`,
        title: slide.title || (index === 0 ? 'Slide' : `Slide ${index + 1}`),
        imageUrl: forceFigurinhas ? cleanFigurinhasImage(slide.imageUrl || customization.bannerUrl || coverFallback) : (slide.imageUrl || customization.bannerUrl || coverFallback)
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
    brandName: sidebar.brandName,
    homeLabel: sidebar.links.home,
    instagramLabel: sidebar.links.instagram,
    supportLabel: sidebar.links.support,
    heroTitle: home.banner.title,
    modulesTitle: sections.find((section) => section.type === 'modules')?.title || defaultCustomization.modulesTitle,
    visibleSections: [
      ...(home.banner.visible ? ['banner'] : []),
      ...sections.filter((section) => section.visible !== false).map((section) => section.type)
    ]
  }
}

const localStoreKey = (id: string, key: 'settings' | 'customization' | 'groups') => `members-area:${id}:${key}`

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

const mapMembersAreaFromSupabase = (row: Record<string, any>): MembersArea => ({
  id: row.id,
  name: row.courses?.[0]?.title || row.title || 'Área de membros',
  courseId: row.courses?.[0]?.id || row.course_id || '',
  productId: row.product_id || row.courses?.[0]?.product_id || undefined,
  students: row.students || 0,
  coverUrl: row.courses?.[0]?.cover_url || row.cover_url || undefined,
  settings: { ...defaultSettings, ...(row.settings || {}) },
  customization: normalizeCustomization(
    { ...(row.customization || {}), ...readLocalValue(row.id, 'customization', {}) },
    row.courses?.[0]?.title || row.title || 'Área de membros',
    row.courses?.[0]?.cover_url || row.cover_url || ''
  )
})

const mapCourseFromSupabase = (row: Record<string, any>): MembersAreaCourse => ({
  id: row.id,
  title: row.title || 'Curso',
  description: row.description || '',
  productId: row.product_id || undefined,
  coverUrl: row.cover_url || undefined
})

const mapModuleFromSupabase = (row: Record<string, any>): MembersAreaModule => ({
  title: row.title || 'Modulo',
  lessons: row.lessons?.length || 0,
  status: row.status || 'Publicado'
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
      .select('*, lessons(id)')
      .order('position', { ascending: true })

    if (courseId) query = query.eq('course_id', courseId)

    const { data, error } = await query

    if (error) return fallbackModules()

    return data.map(mapModuleFromSupabase)
  } catch {
    return fallbackModules()
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
        { id: 'student-3', name: 'Henrique Ribas', email: 'henrique@email.com', lastAccess: '20/05/2026 09:20', progress: 0 }
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
