# SPEC-015: Retrieval & Citation Contract

**Status:** Proposed  
**Sprint:** 10 (Knowledge Gateway and RAG Modes)  
**Date:** 2026-05-07  

## Summary

This specification defines the canonical data structures for retrieval results and citations. Consistency in these structures is critical for interoperability between different retrievers and for accurate UI rendering of citations.

## Data Structures

### RetrievalResult

The complete payload returned by the `KnowledgeGateway`.

```typescript
interface RetrievalResult {
  query: string;
  mode: "fast" | "balanced" | "max_quality";
  chunks: RetrievalChunk[];
  metadata: {
    latencyMs: number;
    totalFound: number;
    retrieverId: string;
  };
}
```

### RetrievalChunk

A single fragment of text retrieved from a source.

```typescript
interface RetrievalChunk {
  id: string;          // Internal chunk ID
  sourceId: string;    // ID of the parent document
  text: string;        // Content of the chunk
  score: number;       // Relevancy score (0.0 to 1.0)
  provenance: {
    uri: string;       // Original source URI
    title?: string;    // Display title
    page?: number;     // Page number (if applicable)
    timestamp?: string;// Offset (if video/audio)
  };
  boundaryNotes?: string; // Notes from the semantic layer regarding this chunk
}
```

### Citation

The structure used in the final AI response to link claims to sources.

```typescript
interface Citation {
  sourceId: string;
  chunkId: string;
  textSnippet: string; // The part of the chunk actually used
  provenance: string;  // Human-readable source description (e.g., "Doc A, p. 12")
  score: number;
}
```

## Validation Rules

1. **ID Uniqueness**: `sourceId` + `chunkId` must be unique within a single result set.
2. **Score Range**: All scores must be normalized between `0.0` and `1.0`.
3. **Text Sanitization**: `text` content must be sanitized to prevent injection into the model's context.
4. **Provenance integrity**: URI must be a valid, accessible (or resolvable) link.

## Prompt Injection Protection

The `KnowledgeGateway` MUST wrap retrieved chunks in a protective boundary before passing them to the `ChatService`.

Example:
```
<context_boundary>
Source: [Title] ([URI])
Relevance: [Score]
---
[Chunk Text]
</context_boundary>
```

## References

- SPEC-014: Knowledge Gateway
- SPEC-001: CanonicalChatEvent
