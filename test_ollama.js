const http = require('http');

const data = JSON.stringify({
  model: 'llama3.2-vision',
  prompt: 'Return empty JSON object',
  stream: false
});

const req = http.request({
  hostname: '127.0.0.1',
  port: 11434,
  path: '/api/generate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => { console.log('Response:', body); });
});

req.on('error', (e) => { console.error('Error:', e.message); });
req.write(data);
req.end();
