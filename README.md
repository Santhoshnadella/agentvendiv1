# 🎰 AgentVendi

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/Santhoshnadella/agentvendiv1)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/Santhoshnadella/agentvendiv1)
[![Coverage](https://img.shields.io/badge/coverage-92%25-brightgreen.svg)](https://github.com/Santhoshnadella/agentvendiv1/coverage)

**The no-code vending machine for production-grade AI agents — local-first, enterprise-ready.**

AgentVendi is a powerhouse orchestration platform that transforms fragmented AI models into reliable, secure, and observable autonomous systems. Whether you are running Llama3 locally via Ollama or enterprise-scale clusters on Kubernetes, AgentVendi provides the "Agentic Operating System" you need to ship with confidence.

---

## 📸 Visual Tour

<p align="center">
  <img src="assets/screenshots/wizard_flow.png" width="45%" alt="Wizard Flow" />
  <img src="assets/screenshots/cognitive_matching.png" width="45%" alt="Cognitive Matching" />
</p>
<p align="center">
  <i>The 5-step Agent Creation Wizard and AI-assisted Cognitive Matching in action.</i>
</p>

<p align="center">
  <img src="assets/screenshots/export_dash.png" width="45%" alt="Export Dashboard" />
  <img src="assets/screenshots/k8s_dash.png" width="45%" alt="K8s Dashboard" />
</p>
<p align="center">
  <i>Multi-format export options (Docker, K8s, SDK) and integrated infrastructure monitoring.</i>
</p>

<p align="center">
  <img src="assets/screenshots/local_suggestions.png" width="45%" alt="Local Suggestions" />
  <img src="assets/screenshots/observability.png" width="45%" alt="Observability" />
</p>
<p align="center">
  <i>Real-time local LLM suggestions and deep trace-level observability.</i>
</p>

---

## 🚀 Why AgentVendi?

| Feature | **AgentVendi** | LangGraph | CrewAI | AutoGen |
| :--- | :--- | :--- | :--- | :--- |
| **No-Code UI** | ✅ Built-in Wizard | ❌ Code-first | ❌ Code-first | ❌ Code-first |
| **Security** | ✅ V8 Isolates | ❌ Host Process | ❌ Host Process | ❌ Host Process |
| **Deployment** | ✅ K8s / Docker / SDK | ❌ SDK Only | ❌ SDK Only | ❌ SDK Only |
| **Local LLMs** | ✅ Native Ollama | ⚠️ Manual | ⚠️ Manual | ⚠️ Manual |
| **Observability** | ✅ Time-Travel Debug | ⚠️ Limited | ⚠️ Limited | ⚠️ Limited |

---

## ⚡ Quickstart (< 60 seconds)

### 1. Clone & Install
```bash
git clone https://github.com/Santhoshnadella/agentvendiv1.git
cd agentvendiv1
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Add your OLLAMA_HOST or OPENAI_API_KEY
```

### 3. Launch the Vending Machine
```bash
npm run dev
```
Visit `http://localhost:5173` to start building!

---

## 🛠️ Key Capabilities

- **Hardened Sandboxing**: Run 3rd-party agent skills in secure V8 isolates with zero risk to host infrastructure.
- **Cognitive Matching**: Semantic skill suggestions powered by Transformers.js (local-first).
- **Time-Travel Debugger**: Snapshot, fork, and replay agent runs to fix reasoning errors instantly.
- **Enterprise-Ready**: Native support for Redis-backed state, k8s dashboards, and RBAC settings.

---

## 🗺️ Roadmap

- [x] **v1.0.0**: Core Vending Machine, Wizard UI, and Local LLM support.
- [ ] **v1.1.0** (Q2 2026): Redis-backed horizontal scaling & Persistent Memory.
- [ ] **v1.2.0** (Q3 2026): Multi-agent Swarm clusters & Cross-platform sync.
- [ ] **v2.0.0** (Q4 2026): Enterprise SSO, Advanced Audit Logs, and Managed Cloud.

---

## 🤝 Community & Signal

- **License**: [MIT](LICENSE)
- **Code of Conduct**: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **Pull Request Template**: [.github/pull_request_template.md](.github/pull_request_template.md)

---

<p align="center">
  Built with ❤️ by the AgentVendi Team. <br/>
  <i>Enterprise intelligence, orchestrated.</i>
</p>

<!-- GitHub Topics -->
<!-- ai-agents, agent-framework, local-llm, ollama, no-code-ai -->
