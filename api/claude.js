export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, imageBase64 } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  try {
    let content;
    if (imageBase64) {
      const match = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (match) {
        const mediaType = match[1];
        const data = match[2];
        content = [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data } },
          { type: 'text', text: prompt }
        ];
      } else {
        content = prompt;
      }
    } else {
      content = prompt;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{ role: 'user', content }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    let result;
    try {
      result = JSON.parse(text.replace(/```json[\s\S]*?\n/g, '').replace(/```/g, '').trim());
    } catch {
      result = { text };
    }

    return res.status(200).json({ result });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
