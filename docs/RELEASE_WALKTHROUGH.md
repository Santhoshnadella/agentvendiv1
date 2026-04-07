# 🚀 AgentVendi: Official Release Walkthrough (v1.0.0-Enterprise)

Welcome to the future of agentic orchestration. This guide walks you through the core capabilities of the enterprise-hardened AgentVendi platform.

---

## 🏗️ 1. Infrastructure Setup
AgentVendi is now dual-stack.
- **Development**: Zero-config with SQLite.
- **Production**: Scale with PostgreSQL + Connection Pooling.
- **Containerization**: Use the provided `Dockerfile` and `docker-compose.yml`.

```bash
# Setup
npm install
npm run migrate
npm run dev
```

---

## 🔌 2. Connect the Multiverse (MCP)
AgentVendi speaks the **Model Context Protocol**. You can connect to any MCP-compliant server (like the Filesystem or Brave Search server) to instantly give your agents hundreds of new tools.
- Go to **Admin > MCP Servers**.
- Add a new server (e.g., `npx -y @modelcontextprotocol/server-filesystem /path/to/data`).
- AgentVendi automatically syncs tools and makes them available in the ReAct loop.

---

## 🤝 3. Agent-to-Agent Collaboration (A2A)
Your agent is no longer an island.
- **Identity**: Every agent has an AgentCard at `/.well-known/agent.json`.
- **Delegation**: Agents can use the `A2AClient` to outsource sub-tasks to other specialized agents across the network.
- **Inbound**: Remote agents can send tasks to your hub via `/a2a/tasks/send`.

---

## ⌛ 4. Master Time (Time-Travel Debugger)
Complex agent logic often fails at Step 5.
- **Snapshots**: Every single turn, memory, and variable state is snapshotted.
- **Forking**: Use the **Time-Travel API** to jump back to Step 3, edit the agent's "thought" or prompt, and re-run.
- **Comparisons**: See how a single change in reasoning results in a completely different outcome.

---

## 🛡️ 5. Secure Extensibility (Plugin Sandbox)
Install community tools without risk.
- **V8 Isolates**: Plugins run in `isolated-vm` sandboxes.
- **Strict I/O**: No filesystem or network access unless explicitly approved via HITL.
- **Discovery**: Once loaded, plugin tools appear in the global tool registry.

---

## 📊 6. Enterprise Monitoring & Billing
- **WebSocket Dashboard**: Watch agents think in real-time. Shared "rooms" allow entire teams to monitor a high-stakes run.
- **HITL**: High-risk actions pause execution and wait for a WebSocket approval response.
- **Token Burn**: Track real-world costs per user, per agent, and per provider. Export to CSV for ROI analysis.
- **SIEM Audit**: Immutable audit logs ensure compliance and can be streamed to Splunk or Datadog.

---

## 🚦 7. Benchmarking
Don't guess—measure.
- Use `npm run test:benchmark` to run standardized reasoning tests against your agents to ensure they haven't regressed after a configuration change.

---

**AgentVendi: Orchestrate. Observe. Optimize.**
