// AI-kald går via Netlify Functions — API-nøglen forlader aldrig browseren
import { supabase } from './supabase.js'

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}
}

export async function analyseClothingImage(imageBase64, mimeType) {
  const authHeader = await getAuthHeader()
  const response = await fetch('/api/analyse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader },
    body: JSON.stringify({ imageBase64, mimeType }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Ukendt fejl' }))
    throw new Error(err.error || `API fejl: ${response.status}`)
  }

  return response.json()
}

export async function generateVintedListing(item) {
  const authHeader = await getAuthHeader()
  const response = await fetch('/api/generate-listing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader },
    body: JSON.stringify(item),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Ukendt fejl' }))
    throw new Error(err.error || `API fejl: ${response.status}`)
  }

  const data = await response.json()
  return data.listing
}
