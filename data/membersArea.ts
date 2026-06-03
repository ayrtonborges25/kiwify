export interface MembersArea {
  id: string
  name: string
  courseId: string
  productId?: string
  students: number
  coverUrl?: string
  settings?: MembersAreaSettings
  customization?: MembersAreaCustomization
}

export interface MembersAreaCourse {
  id: string
  title: string
  description?: string
  productId?: string
  coverUrl?: string
}

export interface MembersAreaStudent {
  id: string
  name: string
  email: string
  lastAccess: string
  progress: number
  isCurrentUser?: boolean
}

export interface MembersAreaGroup {
  id: string
  name: string
  students: number
  isDefault?: boolean
}

export interface MembersAreaLessonAttachment {
  id: string
  name: string
  url: string
  size?: number
  type?: string
}

export interface MembersAreaLesson {
  id: string
  courseId?: string
  moduleId: string
  title: string
  description?: string
  content?: string
  videoUrl?: string
  thumbnailUrl?: string
  attachments?: MembersAreaLessonAttachment[]
  releaseType?: 'immediate' | 'days' | 'date'
  releaseDays?: number
  releaseDate?: string
  durationLimited?: boolean
  position: number
  status: string
}

export interface MembersAreaSettings {
  type: 'lite' | 'complete'
  commentsEnabled: boolean
  language?: string
  antiPiracyEnabled?: boolean
  supportEmail?: string
}

export interface MembersAreaCustomization {
  theme?: {
    primaryColor?: string
    sidebarColor?: string
    backgroundColor?: string
    textColor?: string
  }
  sidebar?: {
    logoUrl?: string
    brandName?: string
    title?: string
    collapsed?: boolean
    links?: {
      home?: string
      instagram?: string
      support?: string
      instagramUrl?: string
      supportUrl?: string
    }
  }
  home?: {
    banner?: {
      title?: string
      imageUrl?: string
      visible?: boolean
    }
    slides?: Array<{
      id: string
      title?: string
      imageUrl?: string
    }>
    sections?: Array<{
      id: string
      type: string
      title: string
      subtitle?: string
      imageUrl?: string
      visible?: boolean
    }>
  }
  menu?: Record<string, any>
  login?: Record<string, any>
  settings?: Record<string, any>
  logoUrl?: string
  bannerUrl?: string
  primaryColor?: string
  sidebarColor?: string
  backgroundColor?: string
  textColor?: string
  brandName?: string
  homeLabel?: string
  instagramLabel?: string
  supportLabel?: string
  heroTitle?: string
  modulesTitle?: string
  visibleSections?: string[]
}

export interface MembersAreaModule {
  id?: string
  courseId?: string
  title: string
  lessons: number
  status: string
  imageUrl?: string
  position?: number
  contents?: MembersAreaLesson[]
}

export const membersAreas: MembersArea[] = [
  { id: 'c6d46bd7-9ced-4fb2-a4a0-ae033e3b612a', name: 'Figurinhas da Copa 2026', courseId: 'ff3e052e-bc89-466f-9392-d1cf3fe738dc', students: 3 }
]

export const membersAreaModules: MembersAreaModule[] = [
  { title: 'Modulo 1', lessons: 4, status: 'Publicado' },
  { title: 'Conteudos bonus', lessons: 2, status: 'Rascunho' }
]
