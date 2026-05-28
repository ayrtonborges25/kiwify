export type MemberClubLesson = {
  id: string
  moduleId: string
  title: string
  description?: string
  videoUrl?: string
  duration?: string
  position: number
  status: 'available' | 'locked'
}

export type MemberClubModule = {
  id: string
  title: string
  description?: string
  imageUrl?: string
  position: number
  status: 'available' | 'locked'
  lessons: MemberClubLesson[]
}

export type MemberClubCourse = {
  id: string
  title: string
  description?: string
  coverUrl?: string
}

export type MemberClub = {
  id: string
  title: string
  subtitle?: string
  instagramUrl?: string
  supportUrl?: string
  brandName?: string
  logoUrl?: string
  customization?: {
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
}

export type MemberClubData = {
  club: MemberClub
  course: MemberClubCourse
  modules: MemberClubModule[]
}

export const defaultClubBanner = ''
export const defaultFigurinhasModuleImage = '/figurinhas-module-thumb.jpg'

const mockModules: MemberClubModule[] = [
  {
    id: 'welcome',
    title: 'Baixar Figurinhas',
    imageUrl: defaultFigurinhasModuleImage,
    position: 1,
    status: 'available',
    lessons: [
      {
        id: 'welcome-lesson',
        moduleId: 'welcome',
        title: 'BAIXE SEUS ARQUIVOS AQUI',
        description: 'Baixe todos os arquivos neste link\nhttps://drive.google.com/drive/folders/1owxb2iB_VVps8W05OqwI8aNjt61ObjjP',
        duration: '',
        position: 1,
        status: 'available'
      }
    ]
  }
]

export const memberClubMocks: Record<string, MemberClubData> = {
  '1cbe33c8-14d3-4612-81e4-b52587203765': {
    club: {
      id: '1cbe33c8-14d3-4612-81e4-b52587203765',
      title: 'Figurinhas da Copa 2026',
      brandName: 'RETRATISTAS DIGITAIS',
      instagramUrl: 'https://instagram.com',
      supportUrl: 'mailto:suporte@ayrtonborgesonline.com'
    },
    course: {
      id: 'b156fdb6-0917-4611-b7d1-3f9915102202',
      title: 'Figurinhas da Copa 2026',
      coverUrl: defaultClubBanner
    },
    modules: mockModules
  },
  'c6d46bd7-9ced-4fb2-a4a0-ae033e3b612a': {
    club: {
      id: 'c6d46bd7-9ced-4fb2-a4a0-ae033e3b612a',
      title: 'Figurinhas da Copa 2026',
      brandName: 'RETRATISTAS DIGITAIS',
      instagramUrl: 'https://instagram.com',
      supportUrl: 'mailto:suporte@ayrtonborgesonline.com'
    },
    course: {
      id: 'ff3e052e-bc89-466f-9392-d1cf3fe738dc',
      title: 'Figurinhas da Copa 2026',
      coverUrl: defaultClubBanner
    },
    modules: mockModules
  }
}

export const getMockMemberClub = (clubId: string): MemberClubData => {
  const mock = memberClubMocks[clubId] || memberClubMocks['1cbe33c8-14d3-4612-81e4-b52587203765']
  return JSON.parse(JSON.stringify({
    ...mock,
    club: {
      ...mock.club,
      id: clubId || mock.club.id
    }
  }))
}
