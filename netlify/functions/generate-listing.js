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

  try {
    const item = JSON.parse(event.body)

    // Grundl�ggende input-validering
    const price = parseInt(item.price)
    if (!item.size || isNaN(price) || price < 1 || price > 10000) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Ugyldig pris eller st�rrelse' }),
      }
    }

    // Feltl�ngdebegr�nsning  forhindrer prompt injection via lange strenge
    const truncate = (str, max) => (str || '').toString().slice(0, max)
    const safeBrand = truncate(item.brand, 100)
    const safeType = truncate(item.type, 100)
    const safeColour = truncate(item.colour, 100)
    const safeCondition = truncate(item.condition, 50)
    const safeDescription = truncate(item.description, 500)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: `Du skriver Vinted-opslag p� dansk. T�jstykke:
- M�rke: ${safeBrand}
- Type: ${safeType}
- Farve: ${safeColour}
- Stand: ${safeCondition}
- Beskrivelse: ${safeDescription}
- Pris: ${price} kr
- St�rrelse: ${item.size}
Skriv et kort, s�lgende Vinted-opslag p� dansk (3-5 s�tninger). Inkluder m�rke, type, farve, stand og st�rrelse. Afslut med pris. Returner KUN selve opslagsteksten, ingen overskrift eller markdown.`,
        }],
      }),
    })

    const data = await response.json()
    const listing = data.content[0].text.trim()

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Intern fejl' }),
    }
  }
}
