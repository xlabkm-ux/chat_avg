---
id: SPEC-026
title: KnowledgeGateway Design MVP (v0.2)
version: 0.2.0
owner: Core Team
status: Draft
last_updated: 2026-05-07
sprint: Sprint R5
---


# KnowledgeGateway Design MVP (v0.2)

## Overview

The KnowledgeGateway is the central interface for Retrieval-Augmented Generation (RAG) in ChatAVG. In Sprint R5, we moved from a pure mock implementation to a persistent, SQLite-based system using FTS5 for full-text search.

## Components

### 1. KnowledgeGateway (Orchestrator)
- Manages RAG modes (`no_retrieval`, `fast`, `balanced`, `max_quality`).
- Resolves the appropriate retriever based on configuration.
- Enforces Answerability Policy.
- Caches results for performance.

### 2. IngestionService
- Pipeline for processing sources (txt, md).
- Implements simple overlap chunking (default: 1000 chars, 200 overlap).
- Handles source registration and chunk persistence.

### 3. KnowledgeRepository
- SQLite storage for `knowledge_sources` and `knowledge_chunks`.
- Virtual table `knowledge_chunks_fts` (FTS5) for high-performance searching.
- Automated triggers to keep the search index in sync with chunk updates.

### 4. SQLiteFTSRetriever
- Adapter implementing the `Retriever` interface.
- Performs full-text search and returns ranked `RetrievalChunk` objects.
- Normalizes SQLite rank scores to [0, 1] range.

## Citation Contract (SPEC-015)

Every retrieved chunk follows a strict contract:
- `id`: Unique chunk identifier (UUID).
- `sourceId`: Reference to the parent source.
- `text`: Extracted content.
- `score`: Relevance score.
- `provenance`: Metadata containing `title` and `uri`.

The system wraps these chunks in `<context_boundary>` tags when presenting them to the model to prevent prompt injection.

## Answerability Policy

The gateway evaluates the quality of retrieved context:
- **Refusal**: If no chunks are found or scores are below the threshold (default: 0.3), the gateway signals that the query cannot be safely answered from the local knowledge base.
- **Downgrade**: If confidence is low, the system may suggest answering with caution or as a hypothesis.

## Scalability

While the current MVP uses SQLite FTS5 for local/repo search, the architecture supports registering external vector database adapters (e.g., Pinecone, Weaviate) by implementing the `search` method.

## Test Coverage

- **Integration**: `tests/knowledge/knowledge_mvp.test.js`
- **Evaluation**: `tests/evals/rag_dataset.json` (30 cases)

## Code Examples

### Example 1: KnowledgeGateway Interface

```javascript
// src/services/knowledgeGateway.service.js
class KnowledgeGateway {
  constructor(config, retrievers, answerabilityPolicy) {
    this.config = config;
    this.retrievers = retrievers; // Map of mode -> Retriever instance
    this.answerabilityPolicy = answerabilityPolicy;
    this.cache = new Map();
    this.CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
  }

  async retrieve(query, options = {}) {
    const mode = options.mode || this.config.defaultMode || 'balanced';
    const cacheKey = `${mode}:${query}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < this.CACHE_TTL_MS) {
      console.log(`Cache hit for: ${cacheKey}`);
      return cached.results;
    }

    // Get appropriate retriever
    const retriever = this.retrievers.get(mode);
    if (!retriever) {
      throw new Error(`Retriever not found for mode: ${mode}`);
    }

    // Execute retrieval
    const results = await retriever.search(query, {
      limit: options.limit || 10,
      minScore: options.minScore || 0.3,
    });

    // Apply answerability policy
    const policyDecision = this.answerabilityPolicy.evaluate(results);

    if (policyDecision.action === 'refuse') {
      console.warn('Query cannot be answered from available knowledge');
      return {
        chunks: [],
        canAnswer: false,
        reason: policyDecision.reason,
      };
    }

    if (policyDecision.action === 'downgrade') {
      console.warn('Low confidence - answering with caution');
    }

    const response = {
      chunks: results,
      canAnswer: true,
      confidence: policyDecision.confidence,
      formattedContext: this.formatContext(results),
    };

    // Cache results
    this.cache.set(cacheKey, {
      results: response,
      cachedAt: Date.now(),
    });

    return response;
  }

  formatContext(chunks) {
    const contextParts = chunks.map(chunk => {
      return `<context_boundary source="${chunk.provenance.title}" score="${chunk.score}">
${chunk.text}
</context_boundary>`;
    });

    return contextParts.join('\n\n');
  }

  clearCache() {
    this.cache.clear();
    console.log('KnowledgeGateway cache cleared');
  }
}

module.exports = KnowledgeGateway;
```

### Example 2: IngestionService for Processing Sources

```javascript
// src/services/ingestion.service.js
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class IngestionService {
  constructor(knowledgeRepository) {
    this.repository = knowledgeRepository;
    this.chunkSize = 1000;
    this.chunkOverlap = 200;
  }

  async ingestFile(filePath, metadata = {}) {
    const content = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath);

    // Register source
    const sourceId = uuidv4();
    await this.repository.saveSource({
      id: sourceId,
      title: metadata.title || fileName,
      uri: metadata.uri || `file://${filePath}`,
      type: metadata.type || this.detectFileType(fileName),
      metadata,
      ingestedAt: new Date().toISOString(),
    });

    // Chunk the content
    const chunks = this.chunkText(content);

    // Save chunks
    const chunkObjects = chunks.map((text, index) => ({
      id: uuidv4(),
      sourceId,
      text,
      chunkIndex: index,
      totalChunks: chunks.length,
      provenance: {
        title: metadata.title || fileName,
        uri: metadata.uri || `file://${filePath}`,
      },
    }));

    await this.repository.saveChunks(chunkObjects);

    console.log(`Ingested ${fileName}: ${chunks.length} chunks`);
    return {
      sourceId,
      chunkCount: chunks.length,
    };
  }

  chunkText(text) {
    const chunks = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + this.chunkSize, text.length);
      const chunk = text.slice(start, end);

      // Try to break at word boundary
      if (end < text.length) {
        const lastSpace = chunk.lastIndexOf(' ');
        if (lastSpace > 0) {
          chunk = chunk.slice(0, lastSpace);
        }
      }

      chunks.push(chunk.trim());
      start += this.chunkSize - this.chunkOverlap;
    }

    return chunks;
  }

  detectFileType(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const typeMap = {
      '.md': 'markdown',
      '.txt': 'text',
      '.json': 'json',
      '.yaml': 'yaml',
      '.yml': 'yaml',
    };
    return typeMap[ext] || 'text';
  }

  async ingestDirectory(dirPath, pattern = '*.md') {
    const files = await fs.readdir(dirPath);
    const results = [];

    for (const file of files) {
      if (file.endsWith(pattern.replace('*', ''))) {
        const filePath = path.join(dirPath, file);
        try {
          const result = await this.ingestFile(filePath, {
            directory: dirPath,
          });
          results.push(result);
        } catch (error) {
          console.error(`Failed to ingest ${file}: ${error.message}`);
        }
      }
    }

    return results;
  }
}

module.exports = IngestionService;
```

### Example 3: SQLiteFTSRetriever Implementation

```javascript
// src/retrievers/sqliteFts.retriever.js
const sqlite3 = require('sqlite3').verbose();

class SQLiteFTSRetriever {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Connected to SQLite FTS database');
          resolve();
        }
      });
    });
  }

  async search(query, options = {}) {
    const limit = options.limit || 10;
    const minScore = options.minScore || 0.3;

    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          kc.id,
          kc.source_id as sourceId,
          kc.text,
          kc.chunk_index as chunkIndex,
          ks.title as sourceTitle,
          ks.uri as sourceUri,
          fts.rank,
          (1.0 / (1.0 + ABS(fts.rank))) as normalizedScore
        FROM knowledge_chunks_fts fts
        JOIN knowledge_chunks kc ON fts.rowid = kc.rowid
        JOIN knowledge_sources ks ON kc.source_id = ks.id
        WHERE knowledge_chunks_fts MATCH ?
        ORDER BY fts.rank
        LIMIT ?
      `;

      this.db.all(sql, [query, limit], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        const results = rows
          .filter(row => row.normalizedScore >= minScore)
          .map(row => ({
            id: row.id,
            sourceId: row.sourceId,
            text: row.text,
            score: parseFloat(row.normalizedScore.toFixed(4)),
            chunkIndex: row.chunkIndex,
            provenance: {
              title: row.sourceTitle,
              uri: row.sourceUri,
            },
          }));

        // Sort by score descending
        results.sort((a, b) => b.score - a.score);

        resolve(results);
      });
    });
  }

  async close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

module.exports = SQLiteFTSRetriever;
```

### Example 4: Answerability Policy Evaluation

```javascript
// src/policies/answerability.policy.js
class AnswerabilityPolicy {
  constructor(config = {}) {
    this.minChunks = config.minChunks || 1;
    this.minScore = config.minScore || 0.3;
    this.highConfidenceThreshold = config.highConfidenceThreshold || 0.7;
    this.lowConfidenceThreshold = config.lowConfidenceThreshold || 0.5;
  }

  evaluate(retrievedChunks) {
    if (!retrievedChunks || retrievedChunks.length === 0) {
      return {
        action: 'refuse',
        confidence: 0,
        reason: 'No relevant chunks found',
      };
    }

    // Calculate average score
    const avgScore = retrievedChunks.reduce((sum, c) => sum + c.score, 0) / retrievedChunks.length;

    // Check if any chunks meet minimum threshold
    const qualifyingChunks = retrievedChunks.filter(c => c.score >= this.minScore);

    if (qualifyingChunks.length < this.minChunks) {
      return {
        action: 'refuse',
        confidence: avgScore,
        reason: `Insufficient qualifying chunks (found ${qualifyingChunks.length}, need ${this.minChunks})`,
      };
    }

    // Determine confidence level
    if (avgScore >= this.highConfidenceThreshold) {
      return {
        action: 'allow',
        confidence: avgScore,
        level: 'high',
      };
    } else if (avgScore >= this.lowConfidenceThreshold) {
      return {
        action: 'allow',
        confidence: avgScore,
        level: 'medium',
      };
    } else {
      return {
        action: 'downgrade',
        confidence: avgScore,
        level: 'low',
        recommendation: 'Answer with caution or mark as hypothesis',
      };
    }
  }

  formatResponseWithConfidence(answer, policyDecision) {
    if (policyDecision.level === 'low') {
      return {
        ...answer,
        disclaimer: 'This answer is based on limited information and may not be fully accurate.',
        confidence: policyDecision.confidence,
      };
    }

    return {
      ...answer,
      confidence: policyDecision.confidence,
    };
  }
}

module.exports = AnswerabilityPolicy;
```

### Example 5: RAG Mode Selection and Configuration

```javascript
// src/config/ragModes.config.js
const RAG_MODES = {
  no_retrieval: {
    description: 'No retrieval - pure model generation',
    enabled: false,
    retriever: null,
    useCase: 'Creative writing, brainstorming, general knowledge',
  },
  fast: {
    description: 'Fast retrieval with minimal context',
    limit: 3,
    minScore: 0.5,
    timeoutMs: 1000,
    useCase: 'Quick lookups, simple fact-checking',
  },
  balanced: {
    description: 'Balanced retrieval (default)',
    limit: 10,
    minScore: 0.3,
    timeoutMs: 3000,
    useCase: 'General Q&A, document analysis',
  },
  max_quality: {
    description: 'Maximum quality with extensive context',
    limit: 20,
    minScore: 0.2,
    timeoutMs: 5000,
    useCase: 'Deep research, complex analysis, technical docs',
  },
};

// Usage in chat service
class ChatServiceWithRAG {
  constructor(knowledgeGateway, ragConfig = RAG_MODES) {
    this.knowledgeGateway = knowledgeGateway;
    this.ragConfig = ragConfig;
  }

  async handleChat(message, options = {}) {
    const mode = options.ragMode || 'balanced';
    const config = this.ragConfig[mode];

    if (!config || !config.enabled) {
      // Skip retrieval
      return await this.generateWithoutRetrieval(message);
    }

    // Retrieve relevant context
    const retrievalResult = await this.knowledgeGateway.retrieve(
      message.query || message.content,
      {
        mode,
        limit: config.limit,
        minScore: config.minScore,
      }
    );

    if (!retrievalResult.canAnswer) {
      return {
        response: `I cannot confidently answer this question based on available knowledge. ${retrievalResult.reason}`,
        canAnswer: false,
      };
    }

    // Generate response with context
    const prompt = this.buildPromptWithContext(
      message.content,
      retrievalResult.formattedContext
    );

    const response = await this.modelGateway.generate(prompt, {
      timeout: config.timeoutMs,
    });

    return {
      response,
      canAnswer: true,
      confidence: retrievalResult.confidence,
      sources: retrievalResult.chunks.map(c => c.provenance),
    };
  }

  buildPromptWithContext(query, context) {
    return `You are a helpful assistant. Use the following context to answer the question. If the context doesn't contain relevant information, say so.

Context:
${context}

Question: ${query}

Answer:`;
  }
}

module.exports = { RAG_MODES, ChatServiceWithRAG };
```
