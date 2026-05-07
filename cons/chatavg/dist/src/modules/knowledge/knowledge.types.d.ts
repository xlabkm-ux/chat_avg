/**
 * Canonical types for the Knowledge Module.
 * Based on SPEC-015.
 */
export class RetrievalChunk {
    constructor({ id, sourceId, text, score, provenance, boundaryNotes }: {
        id: any;
        sourceId: any;
        text: any;
        score: any;
        provenance: any;
        boundaryNotes: any;
    });
    id: any;
    sourceId: any;
    text: any;
    score: any;
    provenance: any;
    boundaryNotes: any;
    validate(): void;
}
export class RetrievalResult {
    constructor({ query, mode, chunks, metadata }: {
        query: any;
        mode: any;
        chunks?: never[] | undefined;
        metadata?: {} | undefined;
    });
    query: any;
    mode: any;
    chunks: RetrievalChunk[];
    metadata: {
        latencyMs: any;
        routerMs: any;
        retrieverMs: any;
        validationMs: any;
        retrieverId: any;
        policyAction: any;
        shouldRefuse: any;
        error: any;
    };
    validate(): void;
}
