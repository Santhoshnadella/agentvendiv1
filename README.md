# 🎰 AgentVendi — Enterprise Agent Orchestration & Execution Platform

AgentVendi is a high-performance "AgOps" platform designed for building, testing, and deploying autonomous agentic workflows. It turns static agent configurations into **real-time, executable runtimes** with industry-grade observability and multi-agent orchestration.

---

## 🚀 Key "God-Level" Features

### 🛠️ Execution & Orchestration
- **Full Agent Runtime**: Built-in ReAct execution loop supporting multi-turn reasoning and tool calling.
- **Multi-Agent crews**: Define "Agent Crews" with specific roles, shared context, and automated/manual handoff logic.
- **Advanced Tools**: Built-in support for Web Search, File Operations (Read/Write/Delete), Browser Automation (simulated), and Knowledge Base RAG.
- **Visual Flow Canvas**: Live SVG-based architecture visualizer showing hand-off paths between agents.

### 📺 Observability & MLOps
- **Monitoring Dashboard**: Real-time SQL-backed logs, latency tracking, and success metrics.
- **Cost Tracking**: Automated "Token Burn" calculation (tokens used vs. cost per 1k) for every agent execution.
- **Time-Travel Debugger**: Edit an agent's past thoughts mid-run and **"Retry from here"** to rewrite its logic path.
- **Brain Inspector**: Live cognitive state visualization showing the agent's current objectives, RAG retrieval quality, and tool dispatcher activity.

### ⚖️ Reliability & Safety
- **Benchmark Suite**: Stress-test agents against standardized test cases with automated performance scoring.
- **Human-in-the-loop (HITL)**: Automatic pause and gatekeeping for sensitive tools (e.g., file deletion) requiring manual user approval.
- **Version Control & Diff**: side-by-side comparison of agent configurations across different versions.
- **Security Middleware**: Global audit logging, RBAC support, and built-in prompt injection guardrails.

### 🌐 Deployment & Integration
- **Vending Machine API**: Generate API keys and call your agents via REST using the built-in CURL playground.
- **WebAI Fallback**: Integrated **Transformers.js** for browser-native model execution and local RAG.
- **Voice Interaction**: Multimodal Text-to-Speech (TTS) integration for audible agent responses in the Sandbox.

---

## 🏗️ Technical Architecture

### **Frontend**
- **Vanilla JS + CSS**: Ultra-premium UI with glassmorphism, neon accents, and smooth micro-animations.
- **Transformers.js**: Local model execution for sentiment/classification fallbacks.
- **Canvas API**: For the visual architecture flow visualizer.

### **Backend**
- **Node.js (Express)**: Unified API for orchestration, versioning, and marketplace.
- **SQLite (Better-SQLite3)**: Persistent storage for users, agents, versions, runs, logs, and audit trails.
- **Ollama Integration**: Native support for local Llama-3, Phi-3, and Mistral via `/api/chat`.

---

## 📦 Deployment Guide

### **1. Docker Compose (One-Click Setup)**
Requires Docker and Docker Compose.
```bash
docker-compose up -d
```
This starts both the **AgentVendi API** (Port 3001) and the **Ollama Engine** (Port 11434).

### **2. Local Development**
1. Install dependencies: `npm install`
2. Start the dev server: `npm run dev`
3. Start the backend: `node server/index.js`

### **3. Production (Vercel + Backend)**
- Use `vercel.json` provided for the frontend.
- Hosting the backend requires a Node-capable server (AWS, Render, or DigitalOcean).

---

## 📜 Repository Structure
- `/server`: Runtime engine, SQL schema, HITL middleware, and API routes.
- `/views`: Observability Dashboard, Sandbox, Benchmarks, and Marketplace.
- `/tabs`: 7-Step Wizard for agent construction (Persona, Skills, Guardrails, etc.).
- `/lib`: State management, WebAI integration, and API wrappers.

---

## 🏆 Hiring Manager Note
This project demonstrates advanced **Systems Engineering**, **MLOps principles**, **LLM Orchestration (ReAct)**, and **Product UI/UX**. It is built to simulate a professional AgOps environment where reliability, safety, and observability are paramount. 🎰🚀
