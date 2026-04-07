# 🚀 AgentVendi Release Walkthrough (v1.1) — "God-Level" Update

Follow this 12-step masterclass to experience the full feature set of AgentVendi v1.1.

---

## 🏗️ Step 1: Initialize Your Environment
1.  **Clone & Install**: `npm install`
2.  **Start Services**: `docker-compose up -d` (Launch AgentVendi API + Ollama Engine).
3.  **Boot the UI**: `npm run dev`

## 🎯 Step 2: Build Your First Agent (The 7-Step Wizard)
1.  Navigate to the **Create** tab.
2.  **Persona**: Define a "Cybersecurity Auditor" with a "stern but professional" tone.
3.  **Cognitive**: Set the reasoning style to "Detailed" and autonomy to 85%.
4.  **Knowledge**: Upload your `API_SECURITY.md` or a URL for RAG retrieval.
5.  **Skills**: Select "Code Review", "Security Audit", and "Documentation".
6.  **Guardrails**: Add a rule: "Never expose private keys or passwords in the output."

## 👥 Step 3: Create a Multi-Agent Crew
1.  In the **Selection** tab, toggle **Multi-Agent Mode**.
2.  Add a second agent: "Lead Developer" with "Conversational" tone.
3.  **Handoffs**: Set the "Auditor" to handoff to the "Developer" if a bug is found.
4.  **Visualizar**: Check the **Flow Canvas** to see the automatic architecture diagram.

## 🧪 Step 4: Live Execution in the Sandbox
1.  Navigate to the **Sandbox** tab.
2.  **Voice Interaction**: Toggle **🎙️ Voice** to "On".
3.  **Brain Inspector**: Watch the "Brain" panel materialize as you send: *"Is there a SQL injection in this login code?"*
4.  Observe the **Cognitive Retrieval** and **Tool Dispatcher** live-updates in the brain panel.

## 🛡️ Step 5: High-Stakes Tooling & HITL
1.  Trigger a sensitive action: *"Delete the outdated `auth-backup.js` file."*
2.  The agent will enter a "Paused" state.
3.  Navigate to the **Monitoring Dashboard** to find the **Pending Approval** request.
4.  Click **Approve** to let the agent proceed or **Deny** to block it.

## 📺 Step 6: Full Observability & MLOps
1.  Check the **Stats Overview** for Total Runs, Success Rate, Average Latency, and **Total Token Cost**.
2.  View the **Agent Run History** table to see your previous executions.

## 🕰️ Step 7: Time-Travel Debugging
1.  Click **View Logs** on a completed run.
2.  Edit one of the agent's assistant messages to change its reasoning.
3.  Click **⏪ Retry from here** to re-run the agent from that turn with your "correction" in its memory.

## 🔄 Step 8: Version Diffing
1.  Navigate to **My Agents**.
2.  Modify your agent and save a new version.
3.  Click **🕰️ History** on the agent card to see the **Visual Diff** of what changed between versions.

## 🎰 Step 9: Use the Vending Machine API
1.  In **My Agents**, click **🔑 Generate New Key**.
2.  Copy your API Key and the provided `curl` command.
3.  Test it: `curl -X POST ...` from your terminal to call your agent programmatically.

## ⚖️ Step 10: Run the Benchmark Suite
1.  Navigate to the **Benchmark** (Evaluator) tab.
2.  Start a "Security Stress Test" on your Auditor agent.
3.  Watch the **Standardized Scoring** (Reliability, Tone, Tool Use) and **Performance Comparison**.

## 🌐 Step 11: Community Marketplace
1.  Navigate to the **Marketplace** tab.
2.  Check out the **SDR Outbound** or **Deep Researcher** templates.
3.  See the **Live Stats** (Clones/Usage) for each agent before cloning it.

## 📦 Step 12: Production Export
1.  Go to **Export** tab.
2.  Choose **Docker Bundle**.
3.  Download your fully self-contained agentic microservice, ready for Vercel, Render, or any enterprise intranet.

---

**Last Updated:** April 2026
**Version:** 1.1 "AgOps Masterclass"
