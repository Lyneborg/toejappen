const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  // Verifik�r Supabase JWT  afviser uautoriserede kald
  const authHeader = event.headers['authorization'] || ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Ikke autoriseret' }),
    }
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  )
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Ikke autoriseret' }),
    }
  }

  // Begr�ns body-st�rrelse (10MB base64 H 7.5MB billede)
  if ((event.body || '').length > 10 * 1024 * 1024) {
    return {
      statusCode: 413,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Billede for stort' }),
    }
  }

  try {
    const { imageBase64, mimeType } = JSON.parse(event.body)

    // Valider filtype via magic bytes  afviser .html, .svg og andre ikke-billeder
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

    // Tillad kun kendte mime-typer  ignorer hvad klienten sender
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp']
    const safeMimeType = allowedMimeTypes.includes(mimeType) ? mimeType : 'image/jpeg'

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: safeMimeType, data: imageBase64 },
            },
            {
              type: 'text',
              text: `Du er en hj�lper der analyserer t�j til Vinted-opslag. Se p� dette billede af et t�jstykke og returner JSON med f�lgende felter:
- brand: m�rke (string, "Ukendt m�rke" hvis ikke synligt)
- type: t�jtype p� dansk (string, f.eks. "bluse", "bukser", "kjole", "jakke", "sweater")
- colour: farve/print p� dansk (string)
- condition: stand p� dansk, �n af: "N�sten ny", "God", "Brugt", "Meget brugt"
- material: materiale hvis synligt (string, eller null)
- description: 2-4 s�tninger om stykket p� dansk, til brug i Vinted-opslag
V�r �rlig om stand. Sig hvad du ser. Returner KUN valid JSON, ingen forklaring eller markdown.`,
            },
          ],
        }],
      }),
    })

    if (!response.ok) {
      const errBody = await response.text()
      console.error('Anthropic API fejl:', response.status, errBody)
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'AI-tjeneste utilg�ngelig' }),
      }
    }

    const data = await response.json()
    let rawText = data.content[0].text.trim()
        if (rawText.startsWith('```')) {
          rawText = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
        }
        const result = JSON.parse(rawText)

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    }
  } catch (err) {
    console.error('analyse function error:', err)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Intern fejl' }),
    }
  }
}
