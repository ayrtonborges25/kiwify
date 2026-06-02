const escapeHtml = (value?: string | null) => String(value || '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

const buildPasswordResetHtml = (code: string) => `
<!doctype html>
<html>
  <body style="margin:0;background:#f3f4f6;font-family:Inter,Arial,sans-serif;color:#111827;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f3f4f6;padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;background:#ffffff;border-radius:12px;box-shadow:0 12px 32px rgba(15,23,42,.12);overflow:hidden;">
            <tr>
              <td style="height:8px;background:#5846f6;"></td>
            </tr>
            <tr>
              <td style="padding:32px 32px 20px;">
                <p style="margin:0 0 12px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#64748b;font-weight:700;">Recuperacao de senha</p>
                <h1 style="margin:0;font-size:26px;line-height:1.2;color:#0f172a;">Use este codigo para trocar sua senha</h1>
                <p style="margin:18px 0 0;font-size:15px;line-height:1.6;color:#475569;">
                  O codigo expira em 15 minutos. Se voce nao pediu essa troca, ignore este email.
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:4px 32px 36px;">
                <div style="display:inline-block;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px 24px;font-size:32px;letter-spacing:8px;font-weight:800;color:#111827;">
                  ${escapeHtml(code)}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

export const sendPasswordResetCodeEmail = async (to: string, code: string) => {
  const config = useRuntimeConfig()
  const resendApiKey = String(config.resendApiKey || '')
  const from = String(config.deliveryEmailFrom || 'noreply@ayrtonborgesonline.com')

  if (!resendApiKey || !to) return false

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to,
      subject: 'Codigo para redefinir sua senha',
      html: buildPasswordResetHtml(code)
    })
  })

  if (!response.ok) {
    console.error('[email] Erro ao enviar codigo de recuperacao.', {
      status: response.status
    })
    return false
  }

  return true
}
