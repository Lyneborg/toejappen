// AI-kald går via Netlify Functions — API-nøglen forlader aldrig browseren

export async function analyseClothingImage(imageBase64, mimeType) {
  const response = await fetch('/api/analyse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Ukendt fejl' }))
    throw new Error(err.error || `API fejl: ${response.status}`)
  }

  return response.json()
}

export async function generateVintedListing(item) {
  const response = await fetch('/api/generate-listing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Ukendt fejl' }))
    throw new Error(err.error || `API fejl: ${response.status}`)
  }

  const data = await response.json()
  return data.listing
}
