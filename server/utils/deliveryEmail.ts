type SupabaseLike = {
  from: (table: string) => any
}

type DeliveryEmailSale = {
  id: string
  product_id?: string | null
  customer_email?: string | null
}

type DeliveryEmailDelivery = {
  id: string
  sale_id: string
  product_id?: string | null
  customer_email?: string | null
  access_url?: string | null
  access_email_sent_at?: string | null
}

const absoluteUrl = (baseUrl: string, path?: string | null) => {
  const fallbackPath = '/'
  const cleanBase = (baseUrl || 'http://localhost:3000').replace(/\/+$/, '')
  const cleanPath = path || fallbackPath
  if (/^https?:\/\//.test(cleanPath)) return cleanPath
  return `${cleanBase}${cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`}`
}

const escapeHtml = (value?: string | null) => String(value || '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

const buildDeliveryEmailHtml = ({
  productName,
  customerEmail,
  accessUrl
}: {
  productName: string
  customerEmail: string
  accessUrl: string
}) => `
<!doctype html>
<html>
  <body style="margin:0;background:#f3f4f6;font-family:Inter,Arial,sans-serif;color:#111827;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f3f4f6;padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;background:#ffffff;border-radius:12px;box-shadow:0 12px 32px rgba(15,23,42,.12);overflow:hidden;">
            <tr>
              <td style="height:8px;background:#00a868;"></td>
            </tr>
            <tr>
              <td style="padding:32px 32px 20px;">
                <p style="margin:0 0 12px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#64748b;font-weight:700;">Compra aprovada</p>
                <h1 style="margin:0;font-size:28px;line-height:1.2;color:#0f172a;">Seu acesso foi liberado</h1>
                <p style="margin:18px 0 0;font-size:16px;line-height:1.6;color:#475569;">
                  O pagamento do produto <strong style="color:#111827;">${escapeHtml(productName)}</strong> foi aprovado.
                  Use o botão abaixo para entrar na área de acesso.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 28px;">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
                  <tr>
                    <td style="padding:18px 20px;">
                      <p style="margin:0 0 6px;font-size:13px;color:#64748b;">Email de compra</p>
                      <p style="margin:0;font-size:15px;color:#111827;font-weight:600;">${escapeHtml(customerEmail)}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 32px 32px;">
                <a href="${escapeHtml(accessUrl)}" style="display:block;background:#5846f6;color:#ffffff;text-decoration:none;font-size:17px;font-weight:700;border-radius:8px;padding:16px 24px;">
                  Acessar meus cursos
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

export const sendProductAccessEmail = async (
  supabase: SupabaseLike,
  sale: DeliveryEmailSale,
  delivery: DeliveryEmailDelivery | null
) => {
  if (!delivery || delivery.access_email_sent_at) return false

  const config = useRuntimeConfig()
  const resendApiKey = String(config.resendApiKey || '')
  const from = String(config.deliveryEmailFrom || 'noreply@ayrtonborgesonline.com')
  const to = delivery.customer_email || sale.customer_email

  if (!resendApiKey || !to) return false

  const productId = delivery.product_id || sale.product_id
  let productName = 'Produto'

  if (productId) {
    const { data: product } = await supabase
      .from('products')
      .select('name')
      .eq('id', productId)
      .maybeSingle()

    productName = product?.name || productName
  }

  const accessUrl = absoluteUrl(String(config.appUrl || 'http://localhost:3000'), '/courses')

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to,
      subject: `Acesso liberado: ${productName}`,
      html: buildDeliveryEmailHtml({
        productName,
        customerEmail: to,
        accessUrl
      })
    })
  })

  if (!response.ok) {
    console.error('[email] Erro ao enviar acesso pelo Resend.', {
      saleId: sale.id,
      deliveryId: delivery.id,
      status: response.status
    })
    return false
  }

  await supabase
    .from('product_deliveries')
    .update({ access_email_sent_at: new Date().toISOString() })
    .eq('id', delivery.id)

  return true
}
