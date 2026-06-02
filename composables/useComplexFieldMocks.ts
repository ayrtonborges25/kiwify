import { nextTick, onBeforeUnmount, onMounted, reactive } from 'vue'
import { updateMembersArea } from '~/services/membersAreaService'
import { uploadFile } from '~/utils/supabase'

type PendingFile = {
  key: string
  name: string
  url: string
  kind: 'image' | 'video'
  file?: File
  multiple?: boolean
}

export const complexFieldState = reactive({
  files: {} as Record<string, string>,
  fileObjects: {} as Record<string, File>,
  richText: {} as Record<string, string>,
  selects: {} as Record<string, string>,
  colors: {} as Record<string, string>,
  activeVideo: null as PendingFile | null,
  isVideoPlaying: false,
  pendingCrop: null as PendingFile | null
})

const objectUrls = new Set<string>()
let imageInput: HTMLInputElement | null = null
let videoInput: HTMLInputElement | null = null
let modalRoot: HTMLDivElement | null = null
let cropStylesInjected = false

const selectOptions: Record<string, string[]> = {
  domain: ['figurinhasdacopa.com', 'digitalborges.com.br', 'kiwify-mock.com'],
  members: ['Figurinhas da Copa 2026', 'Clube dos Fotógrafos - Ayrton Borges'],
  product: ['Todos os produtos', 'Figurinhas da Copa 2026', 'Clube dos Fotógrafos - Ayrton Borges'],
  type: ['Todos', 'Pago', 'Recusado', 'Reembolsado', 'Chargeback'],
  offer: ['Todas as ofertas', 'Checkout A', 'Oferta principal'],
  affiliate: ['Selecione um afiliado (buscar)', 'Ayrton Borges', 'Retratistas Digitais']
}

const getText = (element: Element | null) => element?.textContent?.replace(/\s+/g, ' ').trim() || ''

const makeObjectUrl = (file: File) => {
  const url = URL.createObjectURL(file)
  objectUrls.add(url)
  return url
}

const escapeAttr = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')

const ensureCropStyles = () => {
  if (cropStylesInjected) return

  const style = document.createElement('style')
  style.dataset.kiwifyCropMock = 'true'
  style.textContent = `
    .kiwify-cropper-stage {
      height: 400px;
      overflow: hidden;
      position: relative;
      width: 100%;
    }

    .kiwify-cropper-image {
      display: block;
      height: 400px;
      left: 50%;
      max-height: none !important;
      max-width: none !important;
      position: absolute;
      top: 0;
      transform: translateX(-50%);
      width: auto;
    }

    .kiwify-cropper-crop-box {
      bottom: 0;
      height: 400px;
      left: 50%;
      position: absolute;
      top: 0;
      transform: translateX(-50%);
      width: 266.6667px;
    }

    .kiwify-cropper-crop-box .cropper-view-box img {
      height: 400px;
      left: 50%;
      max-height: none !important;
      max-width: none !important;
      position: absolute;
      top: 0;
      transform: translateX(-50%);
      width: auto;
    }
  `
  document.head.appendChild(style)
  cropStylesInjected = true
}

const cropImageToDataUrl = (url: string) => new Promise<string>((resolve, reject) => {
  const image = new Image()
  image.onload = () => {
    const targetWidth = 320
    const targetHeight = 480
    const targetRatio = targetWidth / targetHeight
    const sourceRatio = image.naturalWidth / image.naturalHeight
    let sourceWidth = image.naturalWidth
    let sourceHeight = image.naturalHeight
    let sourceX = 0
    let sourceY = 0

    if (sourceRatio > targetRatio) {
      sourceWidth = image.naturalHeight * targetRatio
      sourceX = (image.naturalWidth - sourceWidth) / 2
    } else {
      sourceHeight = image.naturalWidth / targetRatio
      sourceY = (image.naturalHeight - sourceHeight) / 2
    }

    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight
    const context = canvas.getContext('2d')
    if (!context) {
      reject(new Error('Canvas indisponível'))
      return
    }

    context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight)
    resolve(canvas.toDataURL('image/png'))
  }
  image.onerror = () => reject(new Error('Não foi possível carregar a imagem'))
  image.src = url
})

const getOrCreateInput = (kind: 'image' | 'video', multiple = false) => {
  const current = kind === 'image' ? imageInput : videoInput
  if (current) {
    current.multiple = multiple
    return current
  }

  const input = document.createElement('input')
  input.type = 'file'
  input.accept = kind === 'image' ? 'image/jpeg,image/jpg,image/png' : 'video/*'
  input.multiple = multiple
  input.className = 'sr-only'
  input.addEventListener('change', () => handleFiles(input.files, kind, multiple))
  document.body.appendChild(input)

  if (kind === 'image') imageInput = input
  else videoInput = input

  return input
}

const ensureModalRoot = () => {
  if (modalRoot) return modalRoot

  modalRoot = document.createElement('div')
  modalRoot.dataset.complexFieldModal = 'true'
  document.body.appendChild(modalRoot)
  return modalRoot
}

const closeComplexModal = () => {
  complexFieldState.pendingCrop = null
  complexFieldState.activeVideo = null
  complexFieldState.isVideoPlaying = false
  if (modalRoot) modalRoot.innerHTML = ''
}

const renderCropModal = () => {
  const file = complexFieldState.pendingCrop
  if (!file) return

  ensureCropStyles()
  const root = ensureModalRoot()
  const safeName = escapeAttr(file.name)
  const safeUrl = escapeAttr(file.url)
  root.innerHTML = `
    <div data-v-7905396a="" class="fixed bottom-0 inset-x-0 sm:inset-0 sm:flex sm:items-center sm:justify-center px-4 py-4" style="z-index: 5000;" data-complex-backdrop>
      <div data-v-7905396a="" class="fixed inset-0 transition-opacity"><div data-v-7905396a="" class="absolute inset-0 bg-gray-500 opacity-75"></div></div>
      <div data-v-7905396a="" role="dialog" aria-modal="true" aria-labelledby="modal-headline" class="sm:max-w-3xl max-h-[95vh] rounded-lg shadow-xl overflow-x-hidden overflow-y-auto transform transition-all sm:w-full">
        <div data-v-7905396a="" class="bg-white px-4 pt-5 pb-4 sm:p-6">
          <div data-v-7905396a="">
            <div data-v-7905396a="" class="mt-3 sm:mt-0 sm:ml-4 sm:text-left">
              <header data-v-7905396a="" class="flex justify-between">
                <h3 data-v-7905396a="" id="modal-headline" class="text-lg leading-6 font-medium text-gray-900">Recortar &amp; Gerenciar</h3>
              </header>
              <div data-v-7905396a="" class="mt-2">
                <div>
                  <div class="cropper-container cropper-bg kiwify-cropper-stage">
                    <img src="${safeUrl}" alt="${safeName}" class="kiwify-cropper-image">
                    <div class="cropper-crop-box kiwify-cropper-crop-box">
                      <span class="cropper-view-box"><img src="${safeUrl}" alt="${safeName}"></span>
                      <span class="cropper-dashed dashed-h"></span>
                      <span class="cropper-dashed dashed-v"></span>
                      <span class="cropper-center"></span>
                      <span class="cropper-face cropper-move"></span>
                      <span class="cropper-line line-e"></span>
                      <span class="cropper-line line-n"></span>
                      <span class="cropper-line line-w"></span>
                      <span class="cropper-line line-s"></span>
                      <span class="cropper-point point-e"></span>
                      <span class="cropper-point point-n"></span>
                      <span class="cropper-point point-w"></span>
                      <span class="cropper-point point-s"></span>
                      <span class="cropper-point point-ne"></span>
                      <span class="cropper-point point-nw"></span>
                      <span class="cropper-point point-sw"></span>
                      <span class="cropper-point point-se"></span>
                    </div>
                  </div>
                  <div class="flex h-full flex-col w-full absolute top-0 py-10" style="display: none;">
                    <div class="bg-gray-500 mt-1 h-80 w-full mb-4 skeleton-box"></div>
                    <div class="flex items-center justify-between border-gray-200"><div class="flex-1"><div class="bg-gray-500 mt-1 h-12 w-full skeleton-box"></div></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <span data-v-7905396a="" class="flex w-full rounded-md shadow-sm sm:ml-3 sm:w-auto"><button data-v-7905396a="" type="button" class="cursor-pointer inline-flex justify-center w-full rounded-md border border-transparent px-4 py-2 text-base leading-6 font-medium text-white shadow-sm focus:outline-none focus:border-red-700 transition ease-in-out duration-150 sm:text-sm sm:leading-5 bg-indigo-600 hover:bg-indigo-500 focus:shadow-outline-indigo" data-crop-confirm>Salvar corte</button></span>
          <span data-v-7905396a="" class="mt-3 flex w-full rounded-md shadow-sm sm:mt-0 sm:w-auto"><button data-v-7905396a="" type="button" class="cursor-pointer inline-flex justify-center w-full rounded-md border border-gray-300 px-4 py-2 bg-white text-base leading-6 font-medium text-gray-700 shadow-sm hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue transition ease-in-out duration-150 sm:text-sm sm:leading-5" data-complex-close>Cancelar</button></span>
        </div>
      </div>
    </div>
  `
}

const renderVideoModal = () => {
  const file = complexFieldState.activeVideo
  if (!file) return

  const root = ensureModalRoot()
  root.innerHTML = `
    <div class="fixed bottom-0 z-50 inset-x-0 px-4 pb-4 sm:inset-0 sm:flex sm:items-center sm:justify-center" data-complex-backdrop>
      <div class="fixed inset-0 transition-opacity"><div class="absolute inset-0 bg-gray-500 opacity-75"></div></div>
      <div role="dialog" aria-modal="true" aria-labelledby="modal-headline" class="bg-white overflow-hidden rounded-lg shadow-xl transform transition-all sm:w-full sm:max-w-lg">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6">
          <div class="mt-3 sm:mt-0 sm:text-left">
            <h3 id="modal-headline" class="text-lg leading-6 font-medium text-gray-900">Preview de vídeo</h3>
            <div class="mt-4 bg-gray-900 rounded-md overflow-hidden">
              <video src="${file.url}" class="w-full" data-video-preview></video>
            </div>
            <p class="mt-3 text-sm leading-5 text-gray-500">${file.multiple ? 'Upload em massa mockado' : 'Upload mockado'}: ${file.name}</p>
          </div>
        </div>
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <span class="flex w-full rounded-md shadow-sm sm:ml-3 sm:w-auto"><button type="button" class="inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 border-transparent focus:border-indigo-700 focus:shadow-outline-indigo leading-5 text-sm px-4 py-2 gap-2 cursor-pointer shadow-sm" data-video-toggle>Play/Pause</button></span>
          <span class="mt-3 flex w-full rounded-md shadow-sm sm:mt-0 sm:w-auto"><button type="button" class="inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-gray-700 hover:text-gray-500 active:text-gray-800 bg-white active:bg-gray-50 border-gray-300 focus:border-blue-300 focus:shadow-outline-blue leading-5 text-sm px-4 py-2 gap-2 cursor-pointer shadow-sm" data-complex-close>Fechar</button></span>
        </div>
      </div>
    </div>
  `
}

const applyImageToSurface = (key: string, url: string) => {
  complexFieldState.files[key] = url

  if (key === 'product-image') {
    const image = document.querySelector<HTMLImageElement>('#general img.w-48')
    if (image) {
      image.style.display = url ? '' : 'none'
      if (url) {
        image.src = url
        image.alt = url
      }
    }
  }

  if (key === 'members-cover') {
    const image = document.querySelector<HTMLImageElement>('[data-members-cover], .mt-8 img')
    if (image) image.src = url
  }

  if (key === 'checkout-image') {
    const image = document.querySelector<HTMLImageElement>('[data-type="image"] img, label[for^="file-"] img')
    if (image) image.src = url
  }
}

const resolveImageTargetKey = (target?: HTMLInputElement | null) => {
  const fieldKey = target?.name || target?.id || ''
  if (fieldKey) return fieldKey
  return currentImageTargetKey()
}

const handleFiles = (files: FileList | null, kind: 'image' | 'video', multiple = false, target?: HTMLInputElement | null) => {
  const file = files?.[0]
  if (!file) return

  const url = makeObjectUrl(file)
  const key = kind === 'image' ? resolveImageTargetKey(target) : 'video-upload'

  if (kind === 'image') {
    complexFieldState.pendingCrop = { key, name: file.name, url, kind, file }
    renderCropModal()
    return
  }

  complexFieldState.fileObjects[key] = file
  complexFieldState.activeVideo = { key, name: multiple && files.length > 1 ? `${files.length} vídeos selecionados` : file.name, url, kind, file, multiple }
  renderVideoModal()
}

let imageTargetKey = 'product-image'
const currentImageTargetKey = () => imageTargetKey

export const openImagePicker = (key: string) => {
  imageTargetKey = key
  const input = getOrCreateInput('image')
  input.value = ''
  input.click()
}

const openVideoPicker = (multiple = false) => {
  const input = getOrCreateInput('video', multiple)
  input.value = ''
  input.click()
}

const inferSelectOptions = (select: HTMLElement) => {
  const text = getText(select.closest('.mt-4, .w-full, .px-4, fieldset, #domainSelect') || select)
  const id = select.closest<HTMLElement>('[id]')?.id || ''
  if (id.toLowerCase().includes('domain') || text.includes('Domínio')) return selectOptions.domain
  if (text.includes('Área de Membros')) return selectOptions.members
  if (text.includes('Produto')) return selectOptions.product
  if (text.includes('Tipo')) return selectOptions.type
  if (text.includes('Oferta')) return selectOptions.offer
  if (text.includes('Afiliado')) return selectOptions.affiliate
  return selectOptions.product
}

const closeAdvancedSelects = (except?: HTMLElement) => {
  document.querySelectorAll<HTMLElement>('.v-select').forEach((select) => {
    if (select === except) return
    select.classList.remove('vs--open')
    select.querySelector<HTMLElement>('ul[role="listbox"]')?.setAttribute('style', 'display: none; visibility: hidden;')
    select.querySelector<HTMLElement>('[role="combobox"]')?.setAttribute('aria-expanded', 'false')
  })
}

const openAdvancedSelect = (select: HTMLElement) => {
  const listbox = select.querySelector<HTMLElement>('ul[role="listbox"]')
  if (!listbox) return

  const options = inferSelectOptions(select)
  listbox.innerHTML = options.map((option) => `
    <li role="option" class="vs__dropdown-option px-3 py-2 text-sm cursor-pointer hover:bg-gray-100" data-option="${option}">${option}</li>
  `).join('')
  listbox.style.display = 'block'
  listbox.style.visibility = 'visible'
  listbox.style.position = 'absolute'
  listbox.style.zIndex = '60'
  listbox.style.background = '#fff'
  listbox.style.width = '100%'
  listbox.style.maxHeight = '14rem'
  listbox.style.overflowY = 'auto'
  listbox.style.border = '1px solid #e5e7eb'
  listbox.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  select.classList.add('vs--open')
  select.querySelector<HTMLElement>('[role="combobox"]')?.setAttribute('aria-expanded', 'true')
}

const selectAdvancedOption = (option: HTMLElement) => {
  const select = option.closest<HTMLElement>('.v-select')
  if (!select) return

  const value = option.dataset.option || getText(option)
  const selectedOptions = select.querySelector<HTMLElement>('.vs__selected-options')
  let selected = selectedOptions?.querySelector<HTMLElement>('.vs__selected')
  if (!selected && selectedOptions) {
    selected = document.createElement('span')
    selected.className = 'vs__selected'
    selectedOptions.prepend(selected)
  }
  if (selected) selected.textContent = value

  const input = select.querySelector<HTMLInputElement>('.vs__search')
  if (input) {
    input.value = ''
    input.placeholder = ''
  }

  complexFieldState.selects[select.id || getText(select.closest('dd, fieldset, .mt-4')) || 'select'] = value
  closeAdvancedSelects()
}

const filterAdvancedSelect = (input: HTMLInputElement) => {
  const select = input.closest<HTMLElement>('.v-select')
  const listbox = select?.querySelector<HTMLElement>('ul[role="listbox"]')
  if (!select || !listbox || listbox.style.display === 'none') return

  const query = input.value.toLowerCase()
  listbox.querySelectorAll<HTMLElement>('[role="option"]').forEach((option) => {
    option.style.display = getText(option).toLowerCase().includes(query) ? 'block' : 'none'
  })
}

const applyColor = (target: HTMLElement) => {
  const value = target.dataset.value || target.style.backgroundColor
  if (!value) return

  const container = target.closest<HTMLElement>('.ql-container')
  const editor = container?.querySelector<HTMLElement>('.ql-editor')
  if (editor) {
    editor.style.color = value
    complexFieldState.colors[container?.id || 'checkout-editor'] = value
  }

  target.parentElement?.querySelectorAll<HTMLElement>('.ql-picker-item').forEach((item) => {
    item.style.outline = ''
  })
  target.style.outline = '2px solid #4f46e5'
}

const hydrateExistingFields = () => {
  const productImage = document.querySelector<HTMLImageElement>('#general img.w-48')
  if (productImage) {
    productImage.classList.add('cursor-pointer')
    productImage.title = 'Selecionar imagem'
    if (complexFieldState.files['product-image']) productImage.src = complexFieldState.files['product-image']
  }

  const coverImage = document.querySelector<HTMLImageElement>('.mt-8 img')
  if (coverImage) {
    coverImage.dataset.membersCover = 'true'
    coverImage.classList.add('cursor-pointer')
    if (complexFieldState.files['members-cover']) coverImage.src = complexFieldState.files['members-cover']
  }

  document.querySelectorAll<HTMLElement>('[contenteditable="true"], textarea').forEach((field, index) => {
    const key = field.id || field.getAttribute('aria-labelledby') || `rich-${index}`
    if (complexFieldState.richText[key]) {
      if (field instanceof HTMLTextAreaElement) field.value = complexFieldState.richText[key]
      else field.innerHTML = complexFieldState.richText[key]
    }
  })
}

export function useComplexFieldMocks() {
  const route = useRoute()
  const onClick = async (event: MouseEvent) => {
    const target = event.target as HTMLElement | null
    if (!target) return

    if (target.closest('[data-complex-close]')) {
      closeComplexModal()
      return
    }

    if (target.closest('[data-crop-confirm]')) {
      const file = complexFieldState.pendingCrop
      if (file) {
        const croppedUrl = await cropImageToDataUrl(file.url).catch(() => file.url)
        if (file.file) complexFieldState.fileObjects[file.key] = file.file
        applyImageToSurface(file.key, croppedUrl)
        window.dispatchEvent(new CustomEvent('kiwify:crop-complete', {
          detail: {
            key: file.key,
            name: file.name,
            url: croppedUrl
          }
        }))
        if (file.key === 'members-cover' && file.file && route.params.id) {
          const extension = file.file.name.split('.').pop() || 'png'
          const uploaded = await uploadFile('member-area-covers', `${String(route.params.id)}/clean-cover.${extension}`, file.file)
          if (uploaded.data?.publicUrl) {
            applyImageToSurface(file.key, uploaded.data.publicUrl)
            await updateMembersArea(String(route.params.id), { coverUrl: uploaded.data.publicUrl })
          }
        }
      }
      closeComplexModal()
      return
    }

    if (target.closest('[data-video-toggle]')) {
      const video = document.querySelector<HTMLVideoElement>('[data-video-preview]')
      if (!video) return
      if (video.paused) {
        video.play()
        complexFieldState.isVideoPlaying = true
      } else {
        video.pause()
        complexFieldState.isVideoPlaying = false
      }
      return
    }

    if (target.closest('[data-complex-backdrop]') && target.classList.contains('absolute')) {
      closeComplexModal()
      return
    }

    if (target.closest('#general img.w-48')) {
      openImagePicker('product-image')
      return
    }

    if (target.closest('[data-members-cover]')) {
      openImagePicker('members-cover')
      return
    }

    const labelFile = target.closest<HTMLLabelElement>('label[for^="file-"]')
    if (labelFile) {
      imageTargetKey = 'checkout-image'
      return
    }

    const text = getText(target)
    if (text === 'Remover imagem') {
      applyImageToSurface('product-image', '')
      return
    }

    if ((text.includes('Upload de vídeos') || text.includes('Upload em massa')) && !target.closest('[data-disable-mock-upload]')) {
      openVideoPicker(text.includes('massa'))
      return
    }

    const option = target.closest<HTMLElement>('[role="option"][data-option]')
    if (option) {
      selectAdvancedOption(option)
      return
    }

    const vSelect = target.closest<HTMLElement>('.v-select')
    if (vSelect) {
      closeAdvancedSelects(vSelect)
      openAdvancedSelect(vSelect)
      return
    }

    const color = target.closest<HTMLElement>('.ql-color .ql-picker-item, .ql-picker-item[data-value]')
    if (color) {
      applyColor(color)
      return
    }

    if (!target.closest('.v-select')) closeAdvancedSelects()
  }

  const onInput = (event: Event) => {
    const target = event.target as HTMLElement | null
    if (!target) return

    if (target instanceof HTMLInputElement && target.type === 'file') {
      const kind = target.accept.includes('video') ? 'video' : 'image'
      handleFiles(target.files, kind, target.multiple, target)
      return
    }

    if (target instanceof HTMLInputElement && target.classList.contains('vs__search')) {
      filterAdvancedSelect(target)
      return
    }

    if (target instanceof HTMLTextAreaElement || target.getAttribute('contenteditable') === 'true') {
      const key = target.id || target.getAttribute('aria-labelledby') || `rich-${Array.from(document.querySelectorAll('[contenteditable="true"], textarea')).indexOf(target)}`
      complexFieldState.richText[key] = target instanceof HTMLTextAreaElement ? target.value : target.innerHTML
    }
  }

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      closeAdvancedSelects()
      closeComplexModal()
    }
  }

  onMounted(async () => {
    await nextTick()
    hydrateExistingFields()
    document.addEventListener('click', onClick)
    document.addEventListener('input', onInput)
    document.addEventListener('keydown', onKeydown)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('click', onClick)
    document.removeEventListener('input', onInput)
    document.removeEventListener('keydown', onKeydown)
  })

  return {
    complexFieldState
  }
}
