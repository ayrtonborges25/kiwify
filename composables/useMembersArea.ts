import {
  createCourse as serviceCreateCourse,
  createModule as serviceCreateModule,
  createMembersArea as serviceCreateMembersArea,
  deleteLesson as serviceDeleteLesson,
  deleteMembersArea as serviceDeleteMembersArea,
  deleteModule as serviceDeleteModule,
  getMembersAreaModulesSnapshot,
  getMembersAreasSnapshot,
  importCourse as serviceImportCourse,
  listCourseModules,
  listMembersAreaCourses,
  listMembersAreaGroups,
  listMembersAreaModules,
  listMembersAreaStudents,
  listMembersAreas,
  saveLesson as serviceSaveLesson,
  saveMembersAreaCustomization as serviceSaveMembersAreaCustomization,
  saveMembersAreaGroups as serviceSaveMembersAreaGroups,
  saveMembersAreaSettings as serviceSaveMembersAreaSettings,
  updateModule as serviceUpdateModule,
  updateMembersArea as serviceUpdateMembersArea
} from '~/services/membersAreaService'

export function useMembersArea() {
  const membersAreasState = ref(getMembersAreasSnapshot())
  const modulesState = ref(getMembersAreaModulesSnapshot())

  const refreshMembersAreas = async () => {
    membersAreasState.value = await listMembersAreas()
    return membersAreasState.value
  }

  const refreshModules = async () => {
    modulesState.value = await listMembersAreaModules()
    return modulesState.value
  }

  const getMembersAreaById = (id: string) => membersAreasState.value.find((area) => area.id === id)

  const createMembersArea = async (...args: Parameters<typeof serviceCreateMembersArea>) => {
    const area = await serviceCreateMembersArea(...args)
    await refreshMembersAreas()
    return area
  }

  const deleteMembersArea = async (id: string) => {
    const deleted = await serviceDeleteMembersArea(id)
    await refreshMembersAreas()
    return deleted
  }

  const updateMembersArea = async (...args: Parameters<typeof serviceUpdateMembersArea>) => {
    const area = await serviceUpdateMembersArea(...args)
    await refreshMembersAreas()
    return area
  }

  const saveMembersAreaSettings = async (...args: Parameters<typeof serviceSaveMembersAreaSettings>) => {
    const area = await serviceSaveMembersAreaSettings(...args)
    await refreshMembersAreas()
    return area
  }

  const saveMembersAreaCustomization = async (...args: Parameters<typeof serviceSaveMembersAreaCustomization>) => {
    const area = await serviceSaveMembersAreaCustomization(...args)
    await refreshMembersAreas()
    return area
  }

  const saveMembersAreaGroups = async (...args: Parameters<typeof serviceSaveMembersAreaGroups>) => serviceSaveMembersAreaGroups(...args)

  const createCourse = async (...args: Parameters<typeof serviceCreateCourse>) => {
    const course = await serviceCreateCourse(...args)
    await refreshModules()
    return course
  }

  const importCourse = async (...args: Parameters<typeof serviceImportCourse>) => {
    const course = await serviceImportCourse(...args)
    await refreshModules()
    return course
  }

  const createModule = async (...args: Parameters<typeof serviceCreateModule>) => serviceCreateModule(...args)
  const updateModule = async (...args: Parameters<typeof serviceUpdateModule>) => serviceUpdateModule(...args)
  const deleteModule = async (...args: Parameters<typeof serviceDeleteModule>) => serviceDeleteModule(...args)
  const saveLesson = async (...args: Parameters<typeof serviceSaveLesson>) => serviceSaveLesson(...args)
  const deleteLesson = async (...args: Parameters<typeof serviceDeleteLesson>) => serviceDeleteLesson(...args)

  void refreshMembersAreas()
  void refreshModules()

  return {
    membersAreas: readonly(membersAreasState),
    modules: readonly(modulesState),
    refreshMembersAreas,
    refreshModules,
    getMembersAreaById,
    listMembersAreaCourses,
    listCourseModules,
    listMembersAreaStudents,
    listMembersAreaGroups,
    createMembersArea,
    updateMembersArea,
    saveMembersAreaSettings,
    saveMembersAreaCustomization,
    saveMembersAreaGroups,
    createModule,
    updateModule,
    deleteModule,
    saveLesson,
    deleteLesson,
    deleteMembersArea,
    createCourse,
    importCourse
  }
}
