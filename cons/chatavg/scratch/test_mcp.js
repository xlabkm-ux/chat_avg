const http = require('http');

async function testMCP() {
  const adminCredentials = JSON.stringify({ username: 'admin', password: 'admin' });

  // 1. Login
  const loginRes = await request('POST', '/api/auth/login', adminCredentials);
  const token = JSON.parse(loginRes).access_token;
  console.log('Logged in.');

  // 2. Update Category 'Мудрец' to use MCP
  const catUpdate = JSON.stringify({
    provider: 'mcp',
    endpoint_url: 'http://127.0.0.1:8202/mcp',
    model_name: 'mcp-default',
    api_key: ''
  });
  
  await request('POST', '/api/admin/categories/%D0%9C%D1%83%D0%B4%D1%80%D0%B5%D1%86', catUpdate, token);
  console.log('Category "Мудрец" updated to use MCP.');

  // 3. Update admin user to use 'Мудрец' category (optional, or just update 'Администратор')
  // Let's update 'Администратор' instead for easier testing as admin
  await request('POST', '/api/admin/categories/%D0%90%D0%B4%D0%BC%D0%B8%D0%BD%D0%B8%D1%81%D1%82%D1%80%D0%B0%D1%82%D0%BE%D1%80', catUpdate, token);
  console.log('Category "Администратор" updated to use MCP.');

  // 4. Try to chat
  const chatReq = JSON.stringify({
    messages: [{ role: 'user', content: 'Привет через MCP!' }],
    stream: false
  });

  console.log('Sending chat request through MCP...');
  try {
    const chatRes = await request('POST', '/api/chat/completions', chatReq, token);
    console.log('MCP Chat Response:', chatRes);
  } catch (err) {
    console.error('MCP Chat Failed:', err.message);
    if (err.body) console.log('Response Body:', err.body);
  }
}

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8200,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body || '')
      }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          const error = new Error(`Status ${res.statusCode}`);
          error.body = data;
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

testMCP().catch(console.error);
