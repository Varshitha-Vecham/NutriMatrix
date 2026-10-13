const ABSTRACT_EMAIL_VALIDATION_URL = 'https://emailreputation.abstractapi.com/v1/'

export class EmailVerificationError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

// Registration only sends an OTP when Abstract confirms the address is deliverable.
export async function verifyEmailDeliverability(email, {
  apiKey = process.env.ABSTRACT_EMAIL_REPUTATION_API_KEY || process.env.ABSTRACT_EMAIL_VALIDATION_API_KEY || process.env.ABSTRACT_API_KEY,
  fetchImpl = fetch,
  requestTimeoutMs = 12000
} = {}) {
  if (!apiKey?.trim()) {
    console.error('Abstract email verification is not configured: ABSTRACT_EMAIL_REPUTATION_API_KEY is missing.')
    throw new EmailVerificationError('CONFIGURATION', 'Email verification is temporarily unavailable. Please try again later.')
  }

  const url = new URL(ABSTRACT_EMAIL_VALIDATION_URL)
  url.searchParams.set('api_key', apiKey.trim())
  url.searchParams.set('email', email)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs)
  let response
  try {
    response = await fetchImpl(url, { signal: controller.signal, headers: { Accept: 'application/json' } })
  } catch (error) {
    const kind = error?.name === 'AbortError' ? 'timed out' : 'was unavailable'
    console.error(`Abstract email verification ${kind}.`, { name: error?.name, code: error?.code })
    throw new EmailVerificationError('UNAVAILABLE', 'Email verification is temporarily unavailable. Please try again later.')
  } finally {
    clearTimeout(timeoutId)
  }

  let result
  try {
    result = await response.json()
  } catch {
    console.error('Abstract email verification returned a non-JSON response.', { status: response.status })
    throw new EmailVerificationError('UNAVAILABLE', 'Email verification is temporarily unavailable. Please try again later.')
  }

  if (!response.ok || result?.error) {
    // Do not log the response body: it can contain provider/account details.
    console.error('Abstract email verification failed.', { status: response.status, hasProviderError: Boolean(result?.error) })
    throw new EmailVerificationError('UNAVAILABLE', 'Email verification is temporarily unavailable. Please try again later.')
  }

  const status = String(result?.email_deliverability?.status || '').toLowerCase()
  const validFormat = result?.email_deliverability?.is_format_valid
  if (status === 'undeliverable' || validFormat === false) {
    return { outcome: 'invalid', status, subStatus: String(result?.email_deliverability?.status_detail || '') }
  }
  if (status === 'deliverable') {
    return { outcome: 'deliverable', status, subStatus: String(result?.email_deliverability?.status_detail || '') }
  }

  return { outcome: 'inconclusive', status, subStatus: String(result?.email_deliverability?.status_detail || '') }
}
