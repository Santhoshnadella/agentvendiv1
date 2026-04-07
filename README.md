# 🎰 AgentVendi: Enterprise AI Orchestration Hub

> *Bridging the gap between raw LLM intelligence and real-world enterprise requirements.*

AgentVendi is a production-grade orchestration platform designed to build, host, and federate AI agents. It transforms fragmented AI tools into a unified, secure, and highly observable ecosystem.

---

## 🛑 The Problem: The "Agentic Gap"
Current AI agent architectures face three critical barriers:
1.  **The Silo Problem**: Agents are isolated islands, unable to securely communicate across different platforms or share toolsets.
2.  **The Black Box Problem**: High-stakes agent runs are hard to debug and even harder to monitor in real-time.
3.  **The Security Paradox**: Enterprises need agents to use 3rd-party tools, but running untrusted code on local hardware is a massive security risk.

## 💡 The Solution: AgentVendi
AgentVendi solves these problems by providing a **Connectivity Tier** for autonomous systems:
-   **Standardized Communication**: Native **MCP** and **A2A** protocol support allows agents to discover and use tools across any platform.
-   **Step-by-Step Observability**: The **Time-Travel Debugger** snapshots every turn, allowing developers to fork, replay, and fix reasoning errors instantly.
-   **Hardened Sandboxing**: All 3rd-party plugins execute in **V8 Isolates** (`isolated-vm`), ensuring zero risk to host infrastructure.

---

## 🛠️ Technology Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Backend** | Node.js (ESM) | High-concurrency event-loop for real-time agent coordination. |
| **Storage** | PostgreSQL / SQLite | Dual-adapter for dev/prod symmetry with pooled connections. |
| **Protocol** | MCP / A2A | Universal standards (Model Context Protocol & Agent-to-Agent). |
| **Security** | isolated-vm | Process-level isolation for untrusted code execution. |
| **Real-Time** | WebSockets (ws) | Low-latency state broadcasts and HITL approvals. |
| **Deployment** | Docker / Kubernetes | Enterprise-grade containerization and orchestration. |

---

## ⚙️ Core Logic & Data Flow

### 1. The ReAct Loop (Reasoning & Action)
Everything starts in the `AgentRuntime`. The platform uses a refined **ReAct** (Think/Act/Observe) loop:
1.  **Think**: LLM analyzes input + available tool schemas.
2.  **Act**: If a tool is called, the system checks:
    -   Is it an **Internal Tool**? (Run locally)
    -   Is it a **Plugin Tool**? (Execute in Sandboxed V8 Isolate)
    -   Is it an **MCP Tool**? (Dispatch JSON-RPC to remote server)
3.  **Observe**: Tool output is sanitized and injected back into message history.

### 2. Time-Travel Architecture
Unlike standard chat platforms, AgentVendi maintains a 100% deterministic state:
-   **Capture**: At Turn $N$, the system stores JSON snapshots of `{messages, memory, variables}`.
-   **Fork**: To fix a hallucination at Turn 3, the engine reconstitutes the state at Turn 2, injects the corrected context, and branches into a new `run_id`.

### 3. Verification & Governance
-   **HITL (Human-in-the-Loop)**: High-risk tools (file deletion, large payments) trigger a WebSocket pause.
-   **Audit Trail**: Every action is saved to an immutable `audit_logs` table and optionally streamed to external SIEM tools.

---

## 📈 Why AgentVendi?
-   **Reduce Debugging Time by 80%**: Forking is faster than restarting.
-   **Zero Governance Friction**: SIEM-ready audit logs satisfy compliance requirements.
-   **Universal Plugin Ecosystem**: Join the community-driven market for `agentvendi-plugin-*` tools.

---

## 📄 Documentation
- [Release Walkthrough](docs/RELEASE_WALKTHROUGH.md)
- [SWOT Analysis](docs/SWOT_ANALYSIS.md)
- [Architecture ADRs](docs/adr/001-architecture-phases.md)

---

**AgentVendi—Enterprise intelligence, orchestrated.**
