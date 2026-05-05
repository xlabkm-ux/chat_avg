// Use built-in fetch

async function test() {
  const loginRes = await fetch('http://127.0.0.1:8200/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin' })
  });
  
  const { access_token } = await loginRes.json();
  console.log('Logged in, token received');

  const payload = {
    provider: 'llamacpp',
    model_name: 'test-model',
    mcp_gateway: 'http://127.0.0.1:8202/mcp',
    system_prompt: 'Test prompt',
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    min_p: 0.05,
    repeat_penalty: 1.1,
    max_tokens: 1024,
    routing_mode: 'direct',
    fallback_provider: null
  };

  const saveRes = await fetch('http://127.0.0.1:8200/api/admin/categories/TestCategory', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + access_token
    },
    body: JSON.stringify(payload)
  });

  const saveResult = await saveRes.json();
  console.log('Save result:', saveResult);

  if (saveRes.ok) {
    console.log('SUCCESS: Category saved successfully');
  } else {
    console.log('FAILURE: Failed to save category');
    process.exit(1);
  }
}

test().catch(err => {
  console.error('Error during test:', err);
  process.exit(1);
});
