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

export const defaultClubBanner = 'https://aws-assets.kiwify.com.br/Qlf7xYHJBhIz7k6/img_0_Design-sem-nome_c4f6eff966f84e6aa1cc65d4b63d7e3a.png'
export const defaultFigurinhasModuleImage = 'https://aws-assets.kiwify.com.br/Qlf7xYHJBhIz7k6/Mobile-1_e271e950cb2c496e913cd05907b971e0.png'

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
        title: 'Bem vindos',
        description: 'Comece por aqui e acompanhe as primeiras instruções do curso.',
        duration: '03:42',
        position: 1,
        status: 'available'
      }
    ]
  },
  {
    id: 'install',
    title: 'Álbum Digital',
    imageUrl: defaultFigurinhasModuleImage,
    position: 2,
    status: 'available',
    lessons: [
      {
        id: 'install-lesson',
        moduleId: 'install',
        title: 'Como instalar',
        description: 'Instale os arquivos e prepare seu ambiente para seguir as aulas.',
        duration: '07:10',
        position: 1,
        status: 'available'
      },
      {
        id: 'install-files',
        moduleId: 'install',
        title: 'Arquivos de apoio',
        description: 'Baixe os materiais de apoio do módulo.',
        duration: '02:18',
        position: 2,
        status: 'available'
      }
    ]
  },
  {
    id: 'editing',
    title: 'Impressão',
    imageUrl: defaultFigurinhasModuleImage,
    position: 3,
    status: 'available',
    lessons: [
      {
        id: 'editing-first',
        moduleId: 'editing',
        title: 'Primeiros passos',
        description: 'Aprenda o fluxo principal de edição.',
        duration: '12:00',
        position: 1,
        status: 'available'
      }
    ]
  },
  {
    id: 'bonus',
    title: 'Bônus',
    imageUrl: defaultFigurinhasModuleImage,
    position: 4,
    status: 'available',
    lessons: [
      {
        id: 'bonus-lesson',
        moduleId: 'bonus',
        title: 'Conteúdo bônus',
        description: 'Conteúdo complementar liberado para alunos.',
        duration: '05:50',
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
  '8718fda1-5d73-484f-9a84-7dd17bb47de5': {
    club: {
      id: '8718fda1-5d73-484f-9a84-7dd17bb47de5',
      title: 'Robô do Lightroom Mobile',
      brandName: 'RETRATISTAS DIGITAIS',
      instagramUrl: 'https://instagram.com',
      supportUrl: 'mailto:suporte@ayrtonborgesonline.com'
    },
    course: {
      id: '3499d88a-a13d-44d9-8659-d6dd463e9e8f',
      title: 'Robô do Lightroom Mobile',
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
