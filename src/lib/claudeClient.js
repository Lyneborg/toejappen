import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
});

export async function generateListing(formData) {
  const response = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `Du skriver Vinted-opslag på dansk.

Tøjstykke:
- Mærke: ${formData.brand}
- Type: ${formData.type}
- Stoftype: ${formData.material}
- Farve: ${formData.colour}
- Stand: ${formData.condition}
- Størrelse: ${formData.size}
- Pris: ${formData.price} kr
${formData.notes ? `- Noter: ${formData.notes}` : ''}

Skriv et kort Vinted-opslag (50-80 ord). Venlig, uformel tone. Start med mærke og type.
Returner KUN teksten, ingen forklaring.`,
      },
    ],
  });

  return response.content[0].text;
}