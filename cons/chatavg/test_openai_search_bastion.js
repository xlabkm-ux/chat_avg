
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import dotenv from 'dotenv';
dotenv.config();

async function testOpenAISearchBastion() {
  const endpoint = "http://47.82.162.93:8202/mcp";
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error("OPENAI_API_KEY not found in .env");
    process.exit(1);
  }

  console.log(`Connecting to ${endpoint} in BASTION MODE...`);
  
  const transport = new SSEClientTransport(new URL(endpoint));
  const client = new Client({ name: "test-client", version: "1.0.0" }, { capabilities: {} });

  try {
    await client.connect(transport);
    console.log("Connected to MCP Gateway!");

    console.log("Calling ai.chat tool with API KEY from .env...");
    const result = await client.callTool({
      name: "ai.chat",
      arguments: {
        messages: [{ role: "user", content: "Проконсультируй меня:" }],
        model: "openai_prompt_file_search:prompt",
        temperature: 0.7, 
        api_key: apiKey,
        extra_params: {
          prompt: {
            id: "pmpt_69fe0facab7c8190845f8e803d634d9f0986bd6fdbb91195",
            version: "2"
          },
          tools: [
            {
              type: "file_search",
              vector_store_ids: ["vs_69fe0ce2642c819193ff2bc7478ce2bf"]
            }
          ]
        },
        stream: false
      }
    });

    console.log("Response received:");
    console.log(JSON.stringify(result, null, 2));

  } catch (err) {
    console.error("Test failed:", err.message);
  } finally {
    process.exit(0);
  }
}

testOpenAISearchBastion();
