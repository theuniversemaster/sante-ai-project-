exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { messages } = JSON.parse(event.body);
    const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

    if (!MISTRAL_API_KEY) {
      console.error("FATAL: MISTRAL_API_KEY environment variable not set.");
      return { statusCode: 500, body: JSON.stringify({ error: "Server configuration error." }) };
    }

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: messages,
        temperature: 0.6,
        safe_prompt: true
      })
    });

    // If Mistral returns an error, log it and pass it to the client
    if (!response.ok) {
        const errorBody = await response.json();
        console.error("Mistral API Error:", errorBody);
        return { statusCode: response.status, body: JSON.stringify(errorBody) };
    }

    const data = await response.json();
    return { statusCode: 200, body: JSON.stringify(data) };

  } catch (error) {
    console.error('Generic Error in ask-mistral function:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to process your request.' }) };
  }
};