exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const { imageBase64, mimeType } = JSON.parse(event.body)

    // Valider filtype via magic bytes — afviser .html, .svg og andre ikke-billeder
    const binary = Buffer.from(imageBase64.slice(0, 16), 'base64')
    const isJPEG = binary[0] === 0xFF && binary[1] === 0xD8
    const isPNG  = binary[0] === 0x89 && binary[1] === 0x50
    const isWebP = binary[8] === 0x57 && binary[9] === 0x45

    if (!isJPEG && !isPNG && !isWebP) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Kun JPEG, PNG og WebP billeder er tilladt' }),
      }
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mimeType, data: imageBase64 },
            },
            {
              type: 'text',
              text: `Du er en hjælper der analyserer tøj til Vinted-opslag. Se på dette billede af et tøjstykke og returner JSON med følgende felter:
- brand: mærke (string, "Ukendt mærke" hvis ikke synligt)
- type: tøjtype på dansk (string, f.eks. "bluse", "bukser", "kjole", "jakke", "sweater")
- colour: farve/print på dansk (string)
- condition: stand på dansk, én af: "Næsten ny", "God", "Brugt", "Meget brugt"
- material: materiale hvis synligt (string, eller null)
- description: 2-4 sætninger om stykket på dansk, til brug i Vinted-opslag
Vær ærlig om stand. Sig hvad du ser. Returner KUN valid JSON, ingen forklaring eller markdown.`,
            },
          ],
        }],
      }),
    })

    const data = await response.json()
    const result = JSON.parse(data.content[0].text)

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    }
  }
}
