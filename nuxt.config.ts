export default defineNuxtConfig({
  compatibilityDate: '2026-05-26',
  experimental: {
    appManifest: false
  },
  css: ['~/assets/css/main.css', '~/assets/css/original-captures.css'],
  app: {
    head: {
      title: 'Kiwify Vue Copy',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }]
    }
  },
  runtimeConfig: {
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    asaasApiKey: process.env.ASAAS_API_KEY || '',
    asaasBaseUrl: process.env.ASAAS_BASE_URL || 'https://api.asaas.com/v3',
    asaasWebhookToken: process.env.ASAAS_WEBHOOK_TOKEN || '',
    resendApiKey: process.env.RESEND_API_KEY || '',
    deliveryEmailFrom: process.env.RESEND_FROM_EMAIL || process.env.DELIVERY_EMAIL_FROM || 'noreply@ayrtonborgesonline.com',
    appUrl: process.env.APP_PUBLIC_URL || process.env.APP_URL || 'http://localhost:3000',
    public: {
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ''
    }
  },
  devtools: { enabled: false }
})
