
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

async function testRemoteMCP() {
  const endpoint = "http://47.82.162.93:8202/mcp";
  console.log(`Connecting to ${endpoint}...`);
  
  const transport = new SSEClientTransport(new URL(endpoint));
  const client = new Client({ name: "test-client", version: "1.0.0" }, { capabilities: {} });

  try {
    await client.connect(transport);
    console.log("Connected to MCP Gateway!");

    console.log("Calling ai.chat tool for Qwen...");
    const result = await client.callTool({
      name: "ai.chat",
      arguments: {
        messages: [{ role: "user", content: "Привет! Ты работаешь?" }],
        model: "qwen:qwen-plus",
        stream: false
      }
    });

    console.log("Response received:");
    console.log(JSON.stringify(result, null, 2));

  } catch (err) {
    console.error("Test failed:", err.message);
    if (err.stack) console.error(err.stack);
  } finally {
    process.exit(0);
  }
}

testRemoteMCP();
