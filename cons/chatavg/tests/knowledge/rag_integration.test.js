
const test = require('node:test');
const assert = require('node:assert');
const chatService = require('../../src/modules/chat/chat.service');
const knowledgeGateway = require('../../src/modules/knowledge/knowledge.gateway');
const categoryRepository = require('../../src/modules/admin/category.repository');

// Mock category repository
const originalFindByName = categoryRepository.findByName;

test('RAG Integration: ChatService', async (t) => {
  
  await t.test('should call KnowledgeGateway when rag_enabled is true', async () => {
    // 1. Setup Mock Category
    categoryRepository.findByName = async () => ({
      rag_enabled: true,
      rag_mode: 'fast',
      provider: 'test',
      model_name: 'mock'
    });

    // 2. Setup Mock Retriever to return a specific chunk
    knowledgeGateway.registerRetriever('default', {
      search: async () => [
        { 
          id: 'c1', 
          sourceId: 's1', 
          text: 'The secret code is 12345', 
          score: 1.0, 
          provenance: { title: 'Secret Doc' } 
        }
      ]
    });

    // 3. Prepare request
    const user = { username: 'testuser', category: 'User' };
    const body = { 
      messages: [{ role: 'user', content: 'What is the secret code?' }],
      stream: false 
    };
    
    // Mock response object
    let responseData = null;
    const res = {
      json: (data) => { responseData = data; },
      req: { on: () => {}, off: () => {}, body }
    };

    // 4. Execute
    await chatService.handleCompletion({ user, body, res });

    // 5. Assertions
    assert.ok(responseData, 'Response should not be null');
    assert.ok(responseData._retrieval, 'Should contain retrieval metadata');
    assert.strictEqual(responseData._retrieval.chunks.length, 1);
    assert.strictEqual(responseData._retrieval.chunks[0].text, 'The secret code is 12345');
    
    // Check if the deterministic provider saw the augmented prompt
    // The DeterministicProvider typically echoes back or returns a fixed string.
    // Let's verify the assistant response contains expected text if possible, 
    // or just that the retrieval metadata is present.
    assert.ok(responseData.choices[0].message.content, 'Should have assistant content');
  });

  // Restore
  t.after(() => {
    categoryRepository.findByName = originalFindByName;
  });
});
