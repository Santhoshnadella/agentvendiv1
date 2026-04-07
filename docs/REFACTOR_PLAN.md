# AgentVendi Robustness Refactor Plan 🛠️

Based on the Senior Engineer "Reality Check," we will implement the following improvements to move from a "prototype foundation" to a "production powerhouse."

## Phase 1: State Store & Scalability (Redis)
- **Objective**: Eliminate in-memory bottlenecks for horizontal scaling.
- **Actions**:
    - [ ] Create `server/lib/redis.js` singleton.
    - [ ] Migrate `WebSocketManager` rooms/clients to Redis Pub/Sub.
    - [ ] Store active `AgentRuntime` transients in Redis (caching).

## Phase 2: Schema Hardening & Mock RAG Replacement
- **Objective**: Move away from keyword-based search to vector-ready logic.
- **Actions**:
    - [ ] Implement `pgvector` compatibility in `db.js`.
    - [ ] Replace `query_knowledge_base` with a more scalable "Semantic Gateway" interface.

## Phase 3: Developer Experience (Typed JSDoc)
- **Objective**: Mitigate the "Blind Type" risk without a full TypeScript migration (keeping it lightweight ESM).
- **Actions**:
    - [ ] Add JSDoc `@type` and `@param` annotations to all core classes (`AgentRuntime`, `PluginManager`).
    - [ ] Implement `Zod` validation for all API inputs and A2A payloads.

## Phase 4: Reliability Guardrails
- **Objective**: Ensure 99.9% uptime for external LLM calls.
- **Actions**:
    - [ ] Integrate `p-retry` into `callLLM` for handling transient network/rate-limit errors.
    - [ ] Harden `withTransaction` to handle nested rollbacks more elegantly.

---

| Feature | Current Status | Target Robustness |
| :--- | :--- | :--- |
| **Session State** | In-Memory (Siloed) | Redis-Backed (Clustered) |
| **Type Safety** | Implicit `any` | Validated JSDoc + Zod |
| **LLM Calls** | Single Attempt | Multi-Retry Exponential Backoff |
| **Knowledge Base** | Keyword Simulation | Vector-Ready Abstraction |
