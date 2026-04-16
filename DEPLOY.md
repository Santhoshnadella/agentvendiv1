# AgentVendi v1 — Deployment Guide

AgentVendi is a monorepo. Deployments typically involve building the shared package, then the frontend and backend.

## 📦 Monorepo Build Process

Before deploying any part of the app, ensure all dependencies are installed and shared packages are built:
```bash
npm install
npm run build --workspaces
```

---

## ☁️ Option 1: Vercel (Frontend) + Dedicated Backend

### Frontend → Vercel
1. In Vercel dashboard:
   - **Root Directory**: `packages/frontend`
   - **Build Command**: `vite build`
   - **Output Directory**: `dist`
2. Configure **Environment Variables**:
   - `VITE_API_URL`: URL of your deployed backend.

### Backend → VPS / Railway
1. **Build Command**: `npm run build -w @agentvendi/backend`
2. **Start Command**: `npm run start -w @agentvendi/backend`
3. **Internal Port**: `3001`

---

## 🐳 Option 2: Docker / Docker Compose (Recommended)

The easiest way to self-host is using the provided Docker configuration.

```bash
# 1. Build and run
docker-compose up --build -d

# 2. Setup database
npm run migrate
```

---

## 🛠️ Infrastructure Requirements

### 1. Database (PostgreSQL / SQLite)
AgentVendi supports PostgreSQL (Production) and SQLite (Local).
- **PostgreSQL**: Set `DATABASE_URL` and `DB_TYPE=postgresql`.
- **SQLite**: Default. Uses file at `data/agentvendi.db`.

### 2. State Management (Redis)
Required for horizontal scaling and background jobs.
- Set `REDIS_URL=redis://your-redis-host:6379`.

---

## 📋 Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3001` | Backend port |
| `DB_TYPE` | No | `sqlite` | `sqlite` or `postgresql` |
| `DATABASE_URL` | No | - | Postgres connection string |
| `REDIS_URL` | No | - | Redis connection string |
| `JWT_SECRET` | **Yes** | - | Secret for agent authentication |
| `OLLAMA_HOST` | No | `http://localhost:11434` | Your local LLM instance |

---

## ✅ Pre-Deploy Checklist

- [ ] Set a strong `JWT_SECRET`.
- [ ] Run `npm run migrate` to initialize your database.
- [ ] Verify `REDIS_URL` if deploying to a cluster.
- [ ] Ensure `packages/frontend/dist` is served via a reverse proxy (Nginx/Caddy) if self-hosting.

---

<p align="center">
  <i>Enterprise intelligence, orchestrated.</i>
</p>

