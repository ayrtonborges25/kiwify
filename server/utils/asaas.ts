export const resolveAsaasRuntime = () => {
  const config = useRuntimeConfig()
  const apiKey = String(config.asaasApiKey || '')
  const configuredBaseUrl = String(config.asaasBaseUrl || '').replace(/\/$/, '')
  const keyIsProduction = apiKey.includes('_prod_')
  const keyIsSandbox = apiKey.includes('_sandbox_')

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'ASAAS_API_KEY nao configurada no servidor.'
    })
  }

  if (!keyIsProduction) {
    throw createError({
      statusCode: 500,
      statusMessage: keyIsSandbox
        ? 'ASAAS_API_KEY ainda esta em sandbox. Configure a chave de producao.'
        : 'ASAAS_API_KEY invalida para producao.'
    })
  }

  return {
    apiKey,
    baseUrl: configuredBaseUrl.includes('sandbox.asaas.com')
      ? 'https://api.asaas.com/v3'
      : configuredBaseUrl || 'https://api.asaas.com/v3'
  }
}

export const normalizeAsaasPixQrCode = (pix: Record<string, any>) => {
  const encodedImage = String(pix.encodedImage || pix.qrCode || '')
  const payload = String(pix.payload || '')

  return {
    pixQrCode: encodedImage && !encodedImage.startsWith('000201') ? encodedImage : undefined,
    pixCopyPaste: payload || (encodedImage.startsWith('000201') ? encodedImage : undefined)
  }
}
