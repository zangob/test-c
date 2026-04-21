import fetch from 'node-fetch';

async function testPoe() {
  try {
    const response = await fetch('https://api.poe.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer sk-poe-aZJSrnsmH3NbB0X5YQ5f6Nj_HY4k1AoeC2-856h1sOk',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-5.3-codex-spark',
        messages: [{ role: 'user', content: 'hi' }]
      })
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    const text = await response.text();
    console.log('Body:', text);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testPoe();
