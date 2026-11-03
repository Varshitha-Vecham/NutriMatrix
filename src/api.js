// During Vite development, /api is proxied to the Node API using API_PORT.
// A deployed frontend can set VITE_API_URL to its API origin explicitly.
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
export const OCR_API_URL = import.meta.env.VITE_OCR_API_URL || 'http://localhost:5001'

export async function apiRequest(path, options = {}) {
  const isFormData = options.body instanceof FormData
  const { timeout = 15000, signal, ...fetchOptions } = options
  const controller = new AbortController()
  let timedOut = false
  const timeoutId = window.setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeout)
  const abortWithRequest = () => controller.abort(signal?.reason)
  if (signal?.aborted) abortWithRequest()
  else signal?.addEventListener('abort', abortWithRequest, { once: true })

  let response
  let responseText
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...fetchOptions,
      signal: controller.signal,
      credentials: 'include',
      headers: { ...(isFormData ? {} : { 'Content-Type': 'application/json' }), ...fetchOptions.headers }
    })
    responseText = response.status === 204 ? '' : await response.text()
  } catch (error) {
    if (timedOut) throw new Error('Verification request timed out. Please try again.')
    if (signal?.aborted) throw new Error('Request was cancelled.')
    throw new Error('Unable to connect to the server. Please try again.')
  } finally {
    window.clearTimeout(timeoutId)
    signal?.removeEventListener('abort', abortWithRequest)
  }

  let data = null
  if (responseText) {
    try {
      data = JSON.parse(responseText)
    } catch {
      const htmlResponse = /<!doctype html|<html/i.test(responseText)
      const message = htmlResponse
        ? `The API returned an HTML page instead of JSON (${response.status}). Check that the NutriMatrix API is running on ${API_URL}.`
        : `The API returned invalid JSON (${response.status}). Check the NutriMatrix API response.`
      throw new Error(message)
    }
  }
  if (!response.ok) {
    // Preserve structured API details so callers can recover from expected
    // states such as an OTP that was already sent while a previous request
    // was still completing.
    const error = new Error(data?.message || 'Something went wrong.')
    error.status = response.status
    if (data && typeof data === 'object') Object.assign(error, data)
    throw error
  }
  return data
}
