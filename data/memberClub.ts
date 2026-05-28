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

const thumbnailBase = 'https://aws-assets.kiwify.com.br/cdn-cgi/image/w=400,h=600,f=avif,q=85,fit=cover/Qlf7xYHJBhIz7k6'

const mockModules: MemberClubModule[] = [
  {
    id: 'welcome',
    title: 'Bem vindos',
    imageUrl: `${thumbnailBase}/course_thumbnails_6704b17e-44e7-40fc-9131-dd0fab0e1ccf_751bc2c31cdb48f2b029792f8cad4053.png`,
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
    title: 'Instalação',
    imageUrl: `${thumbnailBase}/course_thumbnails_9aa9492e-3e8f-41c9-b69d-0b65d7cb5634_e22b4e18419d44eea68d2f1e3edf9b37.png`,
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
    title: 'Edição',
    imageUrl: `${thumbnailBase}/course_thumbnails_7d9b08af-7d1b-4f53-9ddc-230de8785fe9_0aa8f953684148f8902eba0906962ff8.png`,
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
    imageUrl: `${thumbnailBase}/course_thumbnails_54e8445b-0c0d-4b18-b96b-5d60d17f3400_18e3cf2cdf1041dea85547ceea7bd201.png`,
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
      title: 'Figurinhas da Copa 2026'
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
      title: 'Robô do Lightroom Mobile'
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
      title: 'Figurinhas da Copa 2026'
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
