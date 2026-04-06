# AgentVendi — How It Works 🎰

## The Problem It Solves

Setting up AI coding agents today is a pain:
- **Fragmented configs**: Every IDE/tool has its own format (`.cursorrules`, `CLAUDE.md`, `.windsurfrules`)
- **No standardization**: Each developer writes agent rules from scratch
- **No sharing**: Great agent configs stay locked on one person's machine
- **No structure**: Most people don't know what to configure — they just dump instructions
- **No testing**: You deploy an agent config and hope it works

**AgentVendi solves all of this by providing a structured, guided, visual builder that outputs universal agent configs.**

---

## How the Process Works — End to End

```
User Opens App → Picks Template or Starts Fresh
       ↓
   7-Tab Wizard (each tab stores data in global state)
       ↓
   Live Preview updates in real-time (right sidebar)
       ↓
   Dispense → Export Engine generates 8+ config files
       ↓
   ZIP Bundle downloaded → Drop into any project → Agent works
```

---

## Each Tab — Frontend + Backend Flow

### Tab 1: Select — "Pick Your Agent" 🎯

**Frontend (`tabs/selection.js`)**
- Shows template library grid (16 pre-built agents)
- Category filter (Engineering, Security, Data, Frontend, etc.)
- Toggle between single-agent and multi-agent crew mode
- Agent naming with dynamic list for multi-agent

**Backend flow:**
- No backend call at this stage
- State saved to `localStorage` via `lib/state.js`
- Template configs are loaded client-side from `templates/library.js`

**What it solves:** Users don't start from a blank page. 16 professional templates give them a jumpstart.

---

### Tab 2: Behavior — "How It Works" ⚙️

**Frontend (`tabs/behavior.js`)**
- Response style toggle: Concise / Balanced / Detailed / Conversational
- Autonomy slider (0-100%): Ask before acting ↔ Fully autonomous
- Creativity slider (0-100%): Strict ↔ Exploratory
- Error handling strategy: Explain / Auto-fix / Ask user / Retry
- Tool-use toggle

**Backend flow:**
- No backend call — pure client state
- Values feed into the export generator's behavior section

**What it solves:** Different teams need different agent personalities. A startup wants fast, autonomous agents. An enterprise wants cautious, documented actions.

---

### Tab 3: Knowledge — "Feed the Brain" 🧠

**Frontend (`tabs/knowledge.js`)**
- Domain expertise tag selector (30+ technology tags)
- Custom knowledge text area (paste documentation, context)
- URL references list (links to docs/APIs)
- File pattern references (glob patterns like `src/**/*.ts`)

**Backend flow:**
- No backend call for basic use
- When connected to Ollama, the knowledge text gets processed to generate smarter agent instructions via `server/routes/ai.js`

**What it solves:** Agents perform best when they know your tech stack. This tab ensures the agent understands your specific domain.

---

### Tab 4: Role — "Role Assignment" 🎭

**Frontend (`tabs/role.js`)**
- Role title input (e.g., "Senior Backend Developer")
- Persona description textarea
- Communication tone selector (6 options: Professional, Friendly, Technical, Mentor, Direct, Creative)
- Primary objectives textarea
- Constraints textarea

**Backend flow:**
- No backend call
- Role + persona get embedded as the core identity in all exported configs

**What it solves:** An agent without a clear role gives generic responses. This tab creates a focused specialist.

---

### Tab 5: Guardrails — "Guardrails & Standards" 🛡️

**Frontend (`tabs/guardrails.js`)**
- Safety rules checkboxes (6 presets: no secrets, no delete, no prod, etc.)
- Coding standards checkboxes (8 presets: TDD, docs, types, SOLID, etc.)
- Output format instructions
- Prohibited topics
- Quality threshold selector (Low → Strict)
- Custom rules textarea

**Backend flow:**
- No backend call
- Safety rules + policies get injected as hard constraints in every exported config

**What it solves:** Prevents agents from doing dangerous things (deleting files, exposing secrets, running prod commands).

---

### Tab 6: Skills — "Load Skills" 🛠️

**Frontend (`tabs/skills.js`)**
- 15-card skill library with icons and descriptions
- Multi-select (click to toggle)
- Custom skill builder (name + description)

**Backend flow:**
- No backend call
- Selected skills get mapped to descriptive capability statements in the export

**What it solves:** Tells the agent exactly what it's good at — code review, testing, DevOps, etc. — so it focuses on relevant skills.

---

### Tab 7: Cognitive — "Cognitive Calibration" 🧬

**Frontend (`tabs/cognitive.js`)**
- Phase 1: 5-question multiple-choice questionnaire
  - Thinking style, decision-making, learning preference, priorities, feedback style
- Phase 2: Therapy-style chat session (6 guided questions)
- Phase 3: Generated cognitive profile card

**Backend flow (`server/routes/ai.js`):**
1. User message → `POST /api/ai/cognitive-chat`
2. Server tries Ollama first (`http://localhost:11434/api/chat`)
3. If Ollama unavailable → falls back to rule-based responses
4. Each response includes the next guiding question
5. After 6 chats → client-side generates cognitive profile

**What it solves:** Most agent configs miss the user's thinking style. This therapy session ensures the agent matches HOW the user thinks and works.

---

## Export Engine — How Configs Get Generated

**File: `export/generator.js`**

```
State Object → buildCoreSections() → Format-specific template
```

1. `buildCoreSections(state)` reads all 7 tab configs
2. Generates markdown sections: Role, Communication, Behavior, Objectives, Knowledge, Skills, Guardrails, Output Format, Constraints, Working Style
3. Each export format wraps these sections differently:
   - `.cursorrules` / `.windsurfrules` / `.clinerules` → Raw markdown
   - `copilot-instructions.md` → Markdown with header
   - `CLAUDE.md` → Markdown (Claude Code format)
   - `.aider.conf.yml` → YAML with system-prompt key
   - `agent.json` → Full structured JSON
   - `AGENT_README.md` → Human-readable documentation

**File: `export/bundler.js`**
1. Calls `generateAllFormats(state)` → 8+ files
2. Adds CLI installer scripts (bash + PowerShell)
3. Creates ZIP with JSZip
4. Triggers browser download with dispense animation

---

## Backend Architecture

```
POST /api/auth/register     → bcrypt hash → SQLite insert → JWT token
POST /api/auth/login        → bcrypt compare → JWT token
GET  /api/agents            → SQLite query → user's agents
POST /api/agents            → SQLite insert + version record
PUT  /api/agents/:id        → increment version + SQLite update
POST /api/agents/:id/publish → copy to marketplace table
POST /api/agents/:id/clone   → copy config to new user's agents
GET  /api/marketplace        → paginated browse with sorting
POST /api/marketplace/:id/rate → upsert rating + update averages
POST /api/ai/cognitive-chat  → Ollama call or fallback response
GET  /api/analytics/overview → aggregated stats for dashboard
```

**Database tables:**
- `users` — accounts with bcrypt passwords
- `agents` — user's agent configs (JSON blob)
- `agent_versions` — version history for each agent
- `marketplace` — published agents with clone/rating counts
- `ratings` — per-user ratings with upsert logic
- `teams` / `team_members` — team workspaces

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Alt+1-7` | Jump to tab 1-7 |
| `Ctrl+→` | Next tab |
| `Ctrl+←` | Previous tab |
| `Ctrl+Enter` | Dispense agent (on last tab) |
| `Escape` | Close modals |
