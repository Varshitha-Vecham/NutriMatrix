const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
export const OCR_API_URL = import.meta.env.VITE_OCR_API_URL || 'http://localhost:5000'

export async function apiRequest(path, options = {}) {
  const isFormData = options.body instanceof FormData
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: { ...(isFormData ? {} : { 'Content-Type': 'application/json' }), ...options.headers }
  })
  const responseText = response.status === 204 ? '' : await response.text()
  let data = null
  if (responseText) {
    try {
      data = JSON.parse(responseText)
    } catch {
      throw new Error(`API returned an unexpected response (${response.status}). Is the correct local server running?`)
    }
  }
  if (!response.ok) throw new Error(data?.message || 'Something went wrong.')
  return data
}