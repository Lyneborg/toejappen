exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const item = JSON.parse(event.body)

    // Grundlæggende input-validering
    const price = parseInt(item.price)
    if (!item.size || isNaN(price) || price < 1 || price > 10000) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Ugyldig pris eller størrelse' }),
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
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: `Du skriver Vinted-opslag på dansk. Tøjstykke:
- Mærke: ${item.brand}
- Type: ${item.type}
- Farve: ${item.colour}
- Stand: ${item.condition}
- Størrelse: ${item.size}
- Pris: ${item.price} kr
- Materiale: ${item.material || 'ukendt'}
- Beskrivelse: ${item.description}

Skriv et Vinted-opslag på 50-80 ord. Tonen skal være venlig og uformel. Start med mærke og type. Nævn stand og størrelse. Afslut med "Sender gerne! 📦"
Returner KUN opslaget, ingen forklaring.`,
        }],
      }),
    })

    const data = await response.json()

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing: data.content[0].text }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    }
  }
}
