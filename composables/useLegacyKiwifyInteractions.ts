import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  deleteProduct as serviceDeleteProduct,
  duplicateProduct as serviceDuplicateProduct
} from '~/services/productsService'
import { createCourse as serviceCreateCourse, createMembersArea as serviceCreateMembersArea } from '~/services/membersAreaService'

export function useLegacyKiwifyInteractions() {
  const router = useRouter()
  const route = useRoute()
  const { applyProductEditToggleState, toggleProductEditSwitch } = useProductEditToggles()
  const activeDropdown = ref<HTMLElement | null>(null)
  const activeModal = ref<HTMLElement | null>(null)
  const pendingProductId = ref('')

  const setDisplay = (element: Element | null, value: string) => {
    if (element instanceof HTMLElement) {
      element.style.display = value
    }
  }

  const closeDropdowns = () => {
    document.querySelectorAll<HTMLElement>('.dropdown').forEach((dropdown) => {
      dropdown.style.display = 'none'
      dropdown.style.position = ''
      dropdown.style.right = ''
      dropdown.style.top = ''
      dropdown.style.marginTop = ''
      dropdown.style.marginRight = ''
      const panel = dropdown.querySelector<HTMLElement>('.min-w-scale, .w-60, [class*="rounded-md shadow-lg"]')
      setDisplay(panel, 'none')
    })
    activeDropdown.value = null
  }

  const openDropdown = (dropdown: HTMLElement) => {
    closeDropdowns()
    dropdown.style.display = 'block'
    const scope = dropdown.closest<HTMLElement>('.relative.inline-block')
    if (scope) {
      scope.style.position = 'relative'
      dropdown.style.position = 'absolute'
      if (dropdown.closest('td')) {
        dropdown.style.right = '100%'
        dropdown.style.top = '-0.625rem'
        dropdown.style.marginRight = '0.5rem'
        dropdown.style.marginTop = '0'
      } else {
        dropdown.style.right = '0'
        dropdown.style.top = '100%'
        dropdown.style.marginTop = '0.5rem'
      }
      dropdown.style.zIndex = '50'
    }
    const panel = dropdown.querySelector<HTMLElement>('.min-w-scale, .w-60, [class*="rounded-md shadow-lg"]')
    setDisplay(panel, 'block')
    activeDropdown.value = dropdown
  }

  const closeModal = () => {
    if (activeModal.value) {
      activeModal.value.style.display = 'none'
      activeModal.value = null
    }
    document.querySelectorAll<HTMLElement>('[role="dialog"]').forEach((dialog) => {
      const wrapper = dialog.closest<HTMLElement>('.fixed')
      if (wrapper) wrapper.style.display = 'none'
    })
    document.querySelectorAll<HTMLElement>('section > .w-screen.z-50.fixed.h-full.top-0.right-0').forEach((panel) => {
      panel.style.display = 'none'
    })
  }

  const findSurfaceByTitle = (title: string) => {
    const headings = Array.from(document.querySelectorAll<HTMLElement>('[id="modal-headline"], [id="slide-over-title"], h1, h2, h3'))
    const heading = headings.find((node) => node.textContent?.trim().toLowerCase().includes(title.toLowerCase()))
    return heading?.closest<HTMLElement>('.fixed, section[role="dialog"], .w-screen.z-50.fixed')
  }

  const getActiveSurfaceTitle = () => {
    const title = activeModal.value?.querySelector<HTMLElement>('[id="modal-headline"], [id="slide-over-title"], h1, h2, h3')
    return title?.textContent?.trim().toLowerCase() || ''
  }

  const getDeleteProductConfirmationInput = () => {
    return activeModal.value?.querySelector<HTMLInputElement>('input[placeholder="Digite EXCLUIR"]') || null
  }

  const getDeleteProductConfirmationButton = () => {
    const buttons = Array.from(activeModal.value?.querySelectorAll<HTMLButtonElement>('button') || [])
    return buttons.find((button) => button.textContent?.trim() === 'Excluir') || null
  }

  const updateDeleteProductConfirmation = () => {
    if (!getActiveSurfaceTitle().includes('excluir esse produto')) return

    const input = getDeleteProductConfirmationInput()
    const button = getDeleteProductConfirmationButton()
    const isConfirmed = input?.value.trim() === 'EXCLUIR'

    if (!button) return
    button.disabled = !isConfirmed
    button.classList.toggle('opacity-50', !isConfirmed)
    button.classList.toggle('cursor-not-allowed', !isConfirmed)
    button.classList.toggle('cursor-pointer', isConfirmed)
  }

  const openModalByTitle = (title: string) => {
    const wrapper = findSurfaceByTitle(title)
    if (wrapper) {
      closeModal()
      wrapper.style.display = 'flex'
      activeModal.value = wrapper
      updateDeleteProductConfirmation()
      return true
    }
    return false
  }

  const getProductEditPath = (scope: HTMLElement | null, tab = 'general') => {
    const productLink = scope?.closest('tr')?.querySelector<HTMLAnchorElement>('a[href^="/products/edit/"]')
    if (!productLink) return ''
    return `${productLink.pathname}?tab=${tab}`
  }

  const toggleNextHiddenBlock = (target: HTMLElement) => {
    const row = target.closest<HTMLElement>('.px-4.py-5.bg-white, .sm\\:grid, .flex.item-center, .relative')
    const hidden = row?.querySelector<HTMLElement>('[style*="display: none"]')
    if (hidden) {
      hidden.style.display = hidden.style.display === 'none' ? 'block' : 'none'
      return true
    }
    return false
  }

  const completeMockAction = () => {
    closeDropdowns()
    closeModal()
  }

  const openMappedModal = (text?: string | null) => {
    const modalByText: Record<string, string> = {
      'Notificações': 'Notificações',
      'Premiações da Kiwify': 'Premiações da Kiwify',
      'Atualizar endereço': 'Por favor atualize o seu endereço',
      'Alterar representante legal': 'Alterar representante legal',
      'Configurar conta de criador': 'Configurar conta de criador',
      'Upload de vídeos em massa': 'Upload de vídeos em massa',
      'Aceitar convite': 'Aceitar convite',
      'Recusar convite': 'Recusar convite',
      'Cancelar afiliação': 'Cancelar afiliação',
      'Cancelar contrato de co-produção': 'Cancelar contrato de co-produção',
      'Certificado': 'Certificado',
      'Comentários': 'Comentários',
      'Personalização': 'Personalização',
      'Proteção anti pirataria': 'Proteção anti pirataria',
      'Suporte ao cliente': 'Suporte ao cliente',
      'Gerenciar domínios Facebook': 'Gerenciar domínios Facebook',
      '(Gerenciar domínios Facebook)': 'Gerenciar domínios Facebook',
      'Adicionar plano': 'Adicionar plano',
      'Adicionar lote': 'Adicionar lote',
      'Adicionar ingresso': 'Adicionar ingresso'
    }

    const modalTitle = text ? modalByText[text.trim()] : ''
    return modalTitle ? openModalByTitle(modalTitle) : false
  }

  const activateTab = (link: HTMLAnchorElement) => {
    const nav = link.closest('nav')
    if (!nav) return
    nav.querySelectorAll<HTMLAnchorElement>('a').forEach((tab) => {
      tab.classList.remove('text-indigo-700')
      tab.classList.add('hover:text-gray-700', 'focus:outline-none')
    })
    link.classList.add('text-indigo-700')
    link.classList.remove('hover:text-gray-700')
  }

  const activateBuilderTab = (tab: HTMLElement) => {
    const label = tab.textContent?.trim()
    const sidebar = tab.closest('.bg-gray-50.border-l')
    if (!label || !sidebar) return

    const tabs = Array.from(sidebar.querySelectorAll<HTMLElement>('nav > div'))
    tabs.forEach((item) => {
      item.classList.remove('ext-gray-900')
      item.classList.add('text-gray-500', 'hover:text-gray-700')
      const underline = item.querySelector<HTMLElement>('span[aria-hidden="true"]')
      underline?.classList.remove('bg-indigo-500')
      underline?.classList.add('bg-transparent')
    })
    tab.classList.remove('text-gray-500', 'hover:text-gray-700')
    tab.classList.add('ext-gray-900')
    const activeUnderline = tab.querySelector<HTMLElement>('span[aria-hidden="true"]')
    activeUnderline?.classList.remove('bg-transparent')
    activeUnderline?.classList.add('bg-indigo-500')

    const panels = Array.from(sidebar.children).filter((child) => child instanceof HTMLElement) as HTMLElement[]
    const contentPanels = panels.slice(1)
    contentPanels.forEach((panel) => {
      if (!panel.querySelector('nav')) panel.style.display = 'none'
    })

    if (label === 'Configurações') setDisplay(sidebar.querySelector('.bg-white.w-full.h-full'), 'block')
    if (label === 'Linhas') setDisplay(sidebar.querySelector('.overflow-y-auto.h-full.pb-20.px-6'), 'block')
    if (label === 'Componentes') setDisplay(sidebar.querySelector('.overflow-y-auto.h-full.pb-20:not(.px-6)'), 'block')
  }

	  const onClick = async (event: MouseEvent) => {
	    const target = event.target as HTMLElement | null
	    if (!target) return

	    if (toggleProductEditSwitch(target)) return

	    if (activeModal.value && activeModal.value.contains(target) && target.closest('input, textarea, select')) {
	      updateDeleteProductConfirmation()
	      return
	    }

    const modalClose = target.closest('button[aria-label="Close"], button')
    const buttonText = modalClose?.textContent?.trim().toLowerCase()
    if (modalClose?.getAttribute('aria-label') === 'Close' || buttonText === 'cancelar' || buttonText === 'não' || buttonText === 'cancel' || buttonText === 'fechar') {
      closeModal()
      return
    }

    if (target.closest('.absolute.inset-0.bg-gray-500, .absolute.inset-0.bg-gray-600')) {
      closeModal()
      return
    }

    const tabLink = target.closest<HTMLAnchorElement>('a[href*="?tab="]')
    if (tabLink) {
      event.preventDefault()
      router.push(`${tabLink.pathname}${tabLink.search}`)
      activateTab(tabLink)
      return
    }

    const builderTab = target.closest<HTMLElement>('nav[aria-label="Tabs"] > div')
    if (builderTab) {
      activateBuilderTab(builderTab)
      return
    }

    const trigger = target.closest<HTMLElement>('.dropdown-trigger, #options-menu')
    if (trigger) {
      event.preventDefault()
      event.stopPropagation()
      const scope = trigger.closest<HTMLElement>('.relative.inline-block, .relative.inline-block.text-left, .kiwi-color-picker')
      const dropdown = scope?.querySelector<HTMLElement>('.dropdown')
      if (dropdown) {
        if (activeDropdown.value === dropdown && dropdown.style.display !== 'none') closeDropdowns()
        else openDropdown(dropdown)
      }
      return
    }

    const menuItem = target.closest<HTMLElement>('[role="menuitem"]')
    if (menuItem) {
      const text = menuItem.textContent?.trim()
      if (openMappedModal(text)) {
        closeDropdowns()
        return
      }
      if (text === 'Editar') {
        const productPath = getProductEditPath(menuItem)
        if (productPath) {
          router.push(productPath)
          return
        }
      }
      if (text === 'Ver links') {
        const productPath = getProductEditPath(menuItem, 'links')
        if (productPath) {
          router.push(productPath)
          return
        }
      }
      if (text === 'Duplicar' || text === 'Duplicate product') {
        pendingProductId.value = getProductEditPath(menuItem).split('/products/edit/')[1]?.split('?')[0] || pendingProductId.value
        openModalByTitle('Duplicate product')
        closeDropdowns()
        return
      }
      if (text === 'Excluir') {
        pendingProductId.value = getProductEditPath(menuItem).split('/products/edit/')[1]?.split('?')[0] || pendingProductId.value
        openModalByTitle('Excluir')
        closeDropdowns()
        return
      }
      closeDropdowns()
      if (text === 'XLS' || text === 'CSV') openModalByTitle("You're trying to export")
      return
    }

    const text = target.textContent?.trim()
    const normalizedText = text?.toLowerCase()
    const activeTitle = getActiveSurfaceTitle()
    if (openMappedModal(text)) {
      closeDropdowns()
      return
    }
    if (activeTitle.includes('duplicate product') && text === 'Duplicate product') {
      if (pendingProductId.value) await serviceDuplicateProduct(pendingProductId.value)
      completeMockAction()
      return
    }
    if (activeTitle.includes('excluir esse produto')) {
      if (normalizedText !== 'excluir') {
        updateDeleteProductConfirmation()
        return
      }

      updateDeleteProductConfirmation()
      if (getDeleteProductConfirmationInput()?.value.trim() !== 'EXCLUIR') return

      const id = pendingProductId.value || String(route.params.id || '')
      if (id) await serviceDeleteProduct(id)
      completeMockAction()
      router.push('/products')
      return
    }
    if (activeTitle.includes('criar curso') && normalizedText?.startsWith('criar')) {
      await serviceCreateCourse({
        membersAreaId: String(route.params.id || ''),
        title: 'Novo curso',
        status: 'Rascunho'
      })
      completeMockAction()
      return
    }
    if ((activeTitle.includes('criar escola') || activeTitle.includes('criar área de membros')) && normalizedText?.startsWith('criar')) {
      await serviceCreateMembersArea({ name: 'Nova escola', students: 0 })
      completeMockAction()
      return
    }
    if (activeTitle && normalizedText && (
      ['export', 'cobrar', 'reembolsar boleto', 'cancelar assinatura', 'excluir', 'salvar', 'adicionar'].includes(normalizedText)
      || normalizedText.startsWith('reembolsar')
      || normalizedText.startsWith('criar ')
      || normalizedText.startsWith('importar ')
      || normalizedText.startsWith('cancelar todas')
    )) {
      completeMockAction()
      return
    }
    if (text === 'Criar produto') {
      openModalByTitle('Criar produto')
      return
    }
    if (text === 'Duplicate product') {
      openModalByTitle('Duplicate product')
      return
    }
    if (text === 'Criar área de membros') {
      openModalByTitle('Criar área de membros')
      return
    }
    if (text === 'Criar escola') {
      openModalByTitle('Criar escola')
      return
    }
    if (text === 'Excluir escola') {
      openModalByTitle('Excluir escola')
      return
    }
    if (text === 'Criar curso') {
      openModalByTitle('Criar curso')
      return
    }
    if (text === 'Importar curso') {
      openModalByTitle('Importar curso')
      return
    }
    if (text === 'Exportar') {
      return
    }
    if (text === 'Reembolsar') {
      openModalByTitle('Qual é o seu motivo')
      return
    }
    if (text === 'Reembolsar boleto') {
      openModalByTitle('Reembolsar boleto')
      return
    }
    if (text === 'Realizar cobrança') {
      openModalByTitle('Realizar cobrança')
      return
    }
    if (text === 'Cancelar assinatura') {
      openModalByTitle('Cancelar assinatura')
      return
    }
    if (text === 'Excluir produto') {
      const deleteProductButton = target.closest<HTMLButtonElement>('button')
      if (deleteProductButton?.textContent?.trim() !== 'Excluir produto') {
        if (!target.closest('.dropdown')) closeDropdowns()
        return
      }
      pendingProductId.value = String(route.params.id || pendingProductId.value || '')
      openModalByTitle('excluir esse produto')
      return
    }
    if (text === 'Cancelar todas assinaturas' || text === 'Cancelar assinaturas') {
      openModalByTitle('cancelar todas as assinaturas')
      return
    }
    if (text === 'Adicionar link') {
      openModalByTitle('Adicionar link')
      return
    }
    if (text === 'Adicionar order bump') {
      openModalByTitle('Adicionar order bump')
      return
    }
    if (text === 'Editar Facebook Pixel (avançado)') {
      openModalByTitle('Editar Facebook Pixel')
      return
    }
    if (text === 'Criar novo frete') {
      openModalByTitle('frete')
      return
    }
    if (text === 'Gerador de upsell') {
      openModalByTitle('Gerador de upsell')
      return
    }
    if (normalizedText?.includes('página de obrigado personalizada') || normalizedText?.includes('upsell')) {
      if (toggleNextHiddenBlock(target)) return
    }

    if (!target.closest('.dropdown')) closeDropdowns()
  }

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      closeDropdowns()
      closeModal()
    }
  }

  const onInput = () => {
    updateDeleteProductConfirmation()
  }

  onMounted(() => {
    document.addEventListener('click', onClick)
    document.addEventListener('keydown', onKeydown)
    document.addEventListener('input', onInput)
    applyProductEditToggleState()
  })

  watch(() => route.fullPath, () => {
    applyProductEditToggleState()
  }, { flush: 'post' })

  onBeforeUnmount(() => {
    document.removeEventListener('click', onClick)
    document.removeEventListener('keydown', onKeydown)
    document.removeEventListener('input', onInput)
  })

  return {
    activeDropdown,
    activeModal,
    closeDropdowns,
    closeModal
  }
}
