/**
 * Provider: Grok (xAI)
 * Models: grok-3, grok-3-mini, grok-2
 * Endpoint: https://api.x.ai/v1
 * 
 * Special Features:
 * - Managed RAG via 'collections_search' tool.
 */
const { OpenAICompatProvider } = require('./openai_compat');

class GrokProvider extends OpenAICompatProvider {
  async _searchCollections(query, collectionIds, apiKey) {
    const url = 'https://api.x.ai/v1/documents/search';
    console.log(`[Grok RAG] Searching collections: ${collectionIds.join(', ')} for "${query}"`);
    
    const requestBody = {
      query,
      source: {
        collection_ids: collectionIds
      },
      retrieval_mode: { type: 'hybrid' }
    };

    console.log(`\n[Grok RAG] --- OUTGOING SEARCH PAYLOAD ---`);
    console.log(JSON.stringify(requestBody, null, 2));
    console.log(`-----------------------------------------\n`);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const text = await response.text();
        console.error(`[Grok RAG] Search failed: ${response.status} ${text}`);
        return `Error searching collections: ${text}`;
      }
      
      const data = await response.json();
      const results = data.matches || data.results || data.documents || [];
      
      if (Array.isArray(results) && results.length > 0) {
        console.log(`[Grok RAG] Найдено документов: ${results.length}`);
        return results.map(r => `[Document ID: ${r.file_id || r.document_id || 'unknown'}]\n${r.chunk_content || r.text || ''}`).join('\n\n');
      }
      console.log(`[Grok RAG] По запросу ничего не найдено в коллекции.`);
      return "No relevant documents found in the collections.";
    } catch (err) {
      console.error(`[Grok RAG] Search exception:`, err);
      return `Exception during collections search: ${err.message}`;
    }
  }

  async *handleChat(messages, config, options) {
    // Support both 'collection_ids' and 'vector_store_ids' from config or extra_params
    const collectionIds = config.collection_ids || 
                          config.vector_store_ids || 
                          (config.extra_params && (config.extra_params.collection_ids || config.extra_params.vector_store_ids));
    
    let activeConfig = { ...config };

    if (collectionIds && Array.isArray(collectionIds) && collectionIds.length > 0) {
      // Create a deep copy of config or extra_params to avoid side effects
      const extraParams = { ...(config.extra_params || {}) };
      const tools = [...(extraParams.tools || [])];

      // Check if collections search tool is already present to avoid duplicates
      const hasCollectionsTool = tools.some(t => 
        t.type === 'collections_search' || 
        t.type === 'file_search' ||
        (t.type === 'function' && t.function?.name === 'collections_search')
      );
      
      if (!hasCollectionsTool) {
        // x.ai Managed RAG: Using 'function' type to avoid 422 errors on newer models.
        tools.push({
          type: 'function',
          function: {
            name: 'collections_search',
            description: 'Поиск по загруженным документам из коллекций (Managed RAG)',
            parameters: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Поисковый запрос' },
                collection_ids: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'Список ID коллекций для поиска'
                }
              },
              required: ['query']
            }
          }
        });
        
        extraParams.tools = tools;
        activeConfig.extra_params = extraParams;
        console.log(`[Grok] Managed RAG enabled: Injecting 'collections_search' function for ${collectionIds.length} collections`);
      }
    }

    // Support for x.ai Web Search (live_search)
    const enableSearch = config.enable_search || 
                         (config.extra_params && config.extra_params.enable_search);
    
    if (enableSearch) {
      const extraParams = { ...(activeConfig.extra_params || {}) };
      const tools = [...(extraParams.tools || [])];
      
      const hasLiveSearch = tools.some(t => t.type === 'live_search');
      if (!hasLiveSearch) {
        tools.push({ type: 'live_search' });
        extraParams.tools = tools;
        activeConfig.extra_params = extraParams;
        console.log(`[Grok] Live Search (web) enabled`);
      }
    }

    // --- Tool Execution Loop ---
    let currentMessages = [...messages];
    let maxRounds = 2; // Initial request + 1 tool execution round
    
    for (let round = 0; round < maxRounds; round++) {
      const stream = super.handleChat(currentMessages, activeConfig, options);
      let fullContent = '';
      let toolCallDeltas = {};
      let finishReason = 'stop';
      let usage = null;
      let hasYieldedDelta = false;

      for await (const event of stream) {
        if (event.type === 'delta') {
          fullContent += event.text;
          hasYieldedDelta = true;
          yield event;
        } else if (event.type === 'tool_call') {
          // Accumulate streaming tool call deltas
          for (const tc of event.toolCall) {
            const idx = tc.index || 0;
            if (!toolCallDeltas[idx]) toolCallDeltas[idx] = { id: '', function: { name: '', arguments: '' } };
            if (tc.id) toolCallDeltas[idx].id = tc.id;
            if (tc.function?.name) toolCallDeltas[idx].function.name += tc.function.name;
            if (tc.function?.arguments) toolCallDeltas[idx].function.arguments += tc.function.arguments;
          }
          // We don't yield tool_calls that we might handle internally to keep UI clean,
          // unless they are unknown tools.
        } else if (event.type === 'done') {
          finishReason = event.finishReason;
          usage = event.usage;
        } else if (event.type === 'error') {
          yield event;
          return;
        }
      }

      const toolCalls = Object.values(toolCallDeltas).filter(tc => tc.function?.name);
      
      if (finishReason === 'tool_calls' && toolCalls.length > 0) {
        // If the model only returned tool calls and no content, we can handle it silently
        // If it returned content, the user already saw it.
        
        currentMessages.push({ 
          role: 'assistant', 
          content: fullContent || null, 
          tool_calls: toolCalls.map(tc => ({
            id: tc.id,
            type: 'function',
            function: tc.function
          }))
        });

        let handledAny = false;
        for (const tc of toolCalls) {
          if (tc.function.name === 'collections_search') {
            let args = { query: '' };
            try { args = JSON.parse(tc.function.arguments); } catch (e) {
              console.error("[Grok RAG] Failed to parse tool arguments:", tc.function.arguments);
            }
            
            const results = await this._searchCollections(
              args.query, 
              args.collection_ids || collectionIds, 
              activeConfig.api_key
            );
            
            currentMessages.push({
              role: 'tool',
              tool_call_id: tc.id,
              content: results
            });
            handledAny = true;
          } else {
            // For tools we don't handle, we yield the tool call so the client can handle it
            // (Note: this might cause duplicate yielding if we already yielded deltas, 
            // but OpenAICompatProvider yields deltas as they come)
            yield { type: 'tool_call', toolCall: [tc] };
          }
        }

        if (handledAny) {
          // Continue to next round with tool results
          continue;
        }
      }

      // If we are here, we are done with the loop
      if (usage || finishReason) {
        yield { type: 'done', finishReason, usage };
      }
      break;
    }
  }
}

module.exports = new GrokProvider({
  id: 'grok',
  name: 'Grok (xAI)',
  defaultBaseUrl: 'https://api.x.ai/v1',
  defaultModel: 'grok-4-1-fast-non-reasoning',
  models: [
    'grok-4-1-fast-non-reasoning',
    'grok-4-1-fast-non-reasoning-latest',
    'grok-3',
    'grok-3-mini',
    'grok-2',
  ],
});

