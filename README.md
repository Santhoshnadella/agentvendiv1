# 🎰 AgentVendi: Enterprise AI Agent Orchestration

**AgentVendi** is a production-grade, highly interoperable platform for building, hosting, and federating AI agents. It bridges the gap between raw LLM intelligence and real-world enterprise requirements through advanced observability, security sandboxing, and standardized communication protocols.

---

## 🌟 Key Features

| Feature | Description |
| :--- | :--- |
| **Interoperable** | Full **MCP** and **A2A** protocol support. |
| **Observable** | **Time-Travel Debugger** for state snapshots and forking. |
| **Secure** | **Isolated-VM** sandboxing for 3rd-party plugins. |
| **Real-Time** | **WebSocket** monitoring and HITL (Human-in-the-loop). |
| **Enterprise** | PostgreSQL scaling, Token Billing, and SIEM-ready Audit Logs. |

---

## 🚀 Quick Start

### 📦 Installation
```bash
git clone https://github.com/Santhoshnadella/agentvendiv1.git
cd agentvendi
npm install
```

### ⚙️ Environment Configuration
Create a `.env` file:
```env
DB_TYPE=sqlite
JWT_SECRET=your_secret_here
OPENAI_API_KEY=sk-....
ANTHROPIC_API_KEY=...
# Optional for Cloud scaling
DATABASE_URL=postgres://...
```

### 🏃 Running
```bash
# Initialize DB
npm run migrate

# Start Server
npm run dev
```

---

## 🏗️ Architecture Decision Records (ADR)
Detailed architectural insights:
- [001: 7-Phase Evolution & Interoperability](docs/adr/001-architecture-phases.md)
- [002: Secure Plugin Execution (IVM)](docs/adr/002-ivm-sandboxing.md)

---

## 🧪 Testing & Quality
AgentVendi maintains a 100% success rate on its core test suite.
```bash
# Unit & Integration Tests
npm test

# Performance & Reasoning Benchmarks
npm run test:benchmark
```

---

## 🛡️ Security
AgentVendi implement mandatory **HITL (Human-In-The-Loop)** for all high-risk actions (file deletion, large tool calls). 3rd party plugins are executed in **V8 Isolates** with zero inherent access to the host filesystem.

---

## 📄 Documentation
- [Release Walkthrough](docs/RELEASE_WALKTHROUGH.md)
- [SWOT Analysis](docs/SWOT_ANALYSIS.md)
- [API Change Log](docs/api-changes.md)

---

**Built with ❤️ for the Agentic Era.**
