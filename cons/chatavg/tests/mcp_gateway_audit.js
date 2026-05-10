/**
 * ChatAVG MCP Gateway Audit Script
 * Verifies all providers configured in the gateway by routing requests through it.
 */
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mcpAdapter = require('../src/modules/providers/adapters/mcp');

const REPORT_PATH = path.join(__dirname, '../test_mcp_audit_report.md');

// List of models to test through the gateway (format: provider:model)
const MODELS_TO_TEST = [
  'openai_responses:gpt-4o-mini',
  'grok:grok-4-1-fast-reasoning'
];




async function testMcpRoute(modelFullId) {
  const messages = [{ role: 'user', content: 'Say "mcp-ok" once.' }];
  const options = { stream: true };

  // Category-like config for the adapter
  const adapterConfig = {
    endpoint_url: process.env.MCP_GATEWAY_URL,
    model_name: modelFullId,
    // BASTION MODE: Pass the real key from the server side
    api_key: modelFullId.startsWith('openai') ? process.env.OPENAI_API_KEY : 
             modelFullId.startsWith('grok') ? process.env.GROK_API_KEY : undefined,
    extra_params: {
      endpoint_url: modelFullId.startsWith('grok') ? 'https://api.x.ai/v1' : undefined
    }
  };




  console.log(`[MCP Audit] Routing to ${modelFullId} via gateway...`);
  
  let assistantText = '';
  let fullText = '';
  let chunksCount = 0;
  let startTime = Date.now();
  let firstChunkTime = null;

  try {
    const stream = mcpAdapter.handleChat(messages, adapterConfig, options);
    
    for await (const event of stream) {
      if (event.type === 'delta' && event.text) {
        if (chunksCount === 0) firstChunkTime = Date.now() - startTime;
        fullText += event.text;
        // Filter out gateway logs to find actual response
        if (!event.text.startsWith('[MCP_ADAPTER]') && !event.text.includes('[MCP_GATEWAY_DEBUG]')) {
          assistantText += event.text;
        }
        chunksCount++;
      }
      if (event.type === 'error') {
        throw new Error(event.message || 'Unknown MCP error');
      }
    }

    const duration = Date.now() - startTime;
    const cleanText = assistantText.trim();
    const success = cleanText.toLowerCase().includes('mcp-ok');

    return {
      success,
      model: modelFullId,
      text: cleanText,
      duration,
      ttft: firstChunkTime,
      chunks: chunksCount,
      error: success ? null : (fullText.includes('Error') ? fullText : 'Unexpected response')
    };
  } catch (err) {
    return {
      success: false,
      model: modelFullId,
      error: err.message,
      duration: Date.now() - startTime
    };
  }
}

async function run() {
  console.log('=== ChatAVG MCP Gateway Audit ===');
  console.log(`Gateway URL: ${process.env.MCP_GATEWAY_URL}`);
  
  const results = {};
  
  for (const modelId of MODELS_TO_TEST) {
    results[modelId] = await testMcpRoute(modelId);
  }

  // Generate Report
  let md = `# MCP Gateway Audit Report (${new Date().toLocaleString()})\n\n`;
  md += '| Route (Provider:Model) | Status | Latency | TTFT | Chunks | Response/Error |\n';
  md += '| :--- | :--- | :--- | :--- | :--- | :--- |\n';

  for (const [id, res] of Object.entries(results)) {
    const status = res.success ? '✅ OK' : `❌ FAIL`;
    const latency = res.duration ? `${res.duration}ms` : '-';
    const ttft = res.ttft ? `${res.ttft}ms` : '-';
    const chunks = res.chunks || 0;
    const detail = res.error ? `**Error:** ${res.error.replace(/\n/g, ' ')}` : `"${res.text}"`;
    
    md += `| **${id}** | ${status} | ${latency} | ${ttft} | ${chunks} | ${detail} |\n`;
  }

  fs.writeFileSync(REPORT_PATH, md);
  console.log(`\nReport generated: ${REPORT_PATH}`);
  
  if (Object.values(results).every(r => r.success)) {
    console.log('✅ All MCP routes passed!');
  } else {
    console.warn('⚠️ Some routes failed. Check the report.');
  }
}

run().catch(console.error);
