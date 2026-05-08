
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
