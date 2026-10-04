const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers }
  })
  const body = response.status === 204 ? '' : await response.text()
  let data = null

  if (body) {
    try {
      data = JSON.parse(body)
    } catch {
      const htmlResponse = /<!doctype html|<html/i.test(body)
      const message = htmlResponse
        ? `The API returned an HTML page instead of JSON (${response.status}). Check that the NutriMatrix API is running on ${API_URL}.`
        : `The API returned invalid JSON (${response.status}). Check the NutriMatrix API response.`
      throw new Error(message)
    }
  }

  if (!response.ok) throw new Error(data?.message || 'Something went wrong.')
  return data
}
