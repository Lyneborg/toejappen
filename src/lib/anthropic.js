const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

// Analysér et billede af et tøjstykke og returnér strukturerede data
export async function analyseClothingImage(imageBase64, mimeType) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `Du er en hjælper der analyserer tøj til Vinted-opslag.

Se på dette billede af et tøjstykke og returner JSON med følgende felter:
- brand: mærke (string, "Ukendt mærke" hvis ikke synligt)
- type: tøjtype på dansk (string, f.eks. "bluse", "bukser", "kjole", "jakke", "sweater")
- colour: farve/print på dansk (string)
- condition: stand på dansk, én af: "Næsten ny", "God", "Brugt", "Meget brugt"
- material: materiale hvis synligt (string, eller null)
- description: 2-4 sætninger om stykket på dansk, til brug i Vinted-opslag

Vær ærlig om stand. Sig hvad du ser.
Returner KUN valid JSON, ingen forklaring eller markdown.`,
            },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`Anthropic API fejl: ${response.status}`)
  }

  const data = await response.json()
  const text = data.content[0].text

  try {
    return JSON.parse(text)
  } catch {
    throw new Error('Kunne ikke fortolke AI-svar som JSON')
  }
}

// Generer et færdigt Vinted-opslag på dansk
export async function generateVintedListing(item) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `Du skriver Vinted-opslag på dansk.

Tøjstykke:
- Mærke: ${item.brand}
- Type: ${item.type}
- Farve: ${item.colour}
- Stand: ${item.condition}
- Størrelse: ${item.size}
- Pris: ${item.price} kr
- Materiale: ${item.material || 'ukendt'}
- Beskrivelse: ${item.description}

Skriv et Vinted-opslag på 50-80 ord. Tonen skal være venlig og uformel.
Start med mærke og type. Nævn stand og størrelse. Afslut med "Sender gerne! 📦"
Returner KUN opslaget, ingen forklaring.`,
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`Anthropic API fejl: ${response.status}`)
  }

  const data = await response.json()
  return data.content[0].text
}
