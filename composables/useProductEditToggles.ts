import { nextTick, reactive } from 'vue'

const productEditToggleState = reactive<Record<string, boolean>>({
  'Habilitar pagamento com 2 cartões': false,
  'Habilitar pagamento com Cartão + Pix': false,
  'Habilitar parcelamento inteligente': false,
  'Pedir para o comprador repetir o e-mail': true,
  'Coletar o endereço do comprador': false,
  'Coletar o Instagram do comprador': false,
  'Conversão automática de moedas (recomendado)': false
})

const switchRootSelector = '[role="checkbox"], .input-toggle__checkbox__input'

const normalizeText = (value: string) => value.replace(/\s+/g, ' ').trim()

const getSwitchKey = (element: HTMLElement) => {
  const input = element instanceof HTMLInputElement ? element : element.querySelector<HTMLInputElement>('input[type="checkbox"]')
  if (input?.id) {
    const label = document.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(input.id)}"]`)
    if (label?.textContent) return normalizeText(label.textContent)
  }

  const row = element.closest<HTMLElement>('.flex.items-center, .input-toggle__wrapper, fieldset, label')
  const labelText = row?.querySelector<HTMLElement>('label, .form-field__label, .input-toggle__label')?.textContent
  return normalizeText(labelText || row?.textContent || element.textContent || input?.id || '')
}

const readSwitchValue = (element: HTMLElement) => {
  const input = element instanceof HTMLInputElement ? element : element.querySelector<HTMLInputElement>('input[type="checkbox"]')
  if (input) return input.checked || input.classList.contains('bg-indigo-500')

  return element.getAttribute('aria-checked') === 'true' || element.classList.contains('bg-indigo-500')
}

const paintSwitch = (element: HTMLElement, value: boolean) => {
  const root = element instanceof HTMLInputElement ? element.closest<HTMLElement>('.input-toggle__checkbox') || element : element
  const input = root.querySelector<HTMLInputElement>('input[type="checkbox"]')
  const mark = root.querySelector<HTMLElement>('[aria-hidden="true"], .input-toggle__checkbox__mark')

  root.setAttribute('aria-checked', String(value))
  root.classList.toggle('bg-indigo-500', value)
  root.classList.toggle('bg-gray-200', !value)

  if (input) {
    input.checked = value
    input.classList.toggle('bg-indigo-500', value)
    input.classList.toggle('bg-gray-200', !value)
  }

  if (mark) {
    mark.classList.toggle('translate-x-5', value)
    mark.classList.toggle('translate-x-0', !value)
  }
}

export function useProductEditToggles() {
  const applyProductEditToggleState = async () => {
    await nextTick()

    document.querySelectorAll<HTMLElement>(switchRootSelector).forEach((element) => {
      if (element.classList.contains('cursor-not-allowed') || element.closest('.cursor-not-allowed')) return

      const key = getSwitchKey(element)
      if (!key) return

      if (!(key in productEditToggleState)) {
        productEditToggleState[key] = readSwitchValue(element)
      }

      paintSwitch(element, productEditToggleState[key])
    })
  }

  const toggleProductEditSwitch = (element: HTMLElement) => {
    if (element.classList.contains('cursor-not-allowed') || element.closest('.cursor-not-allowed')) return false

    const switchElement = element.matches(switchRootSelector)
      ? element
      : element.closest<HTMLElement>(switchRootSelector)

    if (!switchElement) return false

    const key = getSwitchKey(switchElement)
    if (!key) return false

    productEditToggleState[key] = !(key in productEditToggleState ? productEditToggleState[key] : readSwitchValue(switchElement))
    paintSwitch(switchElement, productEditToggleState[key])
    return true
  }

  return {
    productEditToggleState,
    applyProductEditToggleState,
    toggleProductEditSwitch
  }
}
