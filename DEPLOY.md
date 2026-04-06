# AgentVendi v1 — Deployment Guide

## Option 1: Vercel (Frontend) + Railway (Backend)

### Frontend → Vercel
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Build the frontend
npm run build

# 3. Deploy
vercel --prod
```

In Vercel dashboard:
- Set **Build Command**: `npm run build`
- Set **Output Directory**: `dist`
- Set **Root Directory**: `.` (project root)

### Backend → Railway
```bash
# 1. Push code to GitHub

# 2. Connect Railway to your repo
# Go to https://railway.app → New Project → Deploy from GitHub

# 3. Set environment variables in Railway dashboard:
#    PORT=3001
#    JWT_SECRET=your-strong-secret-here
#    NODE_ENV=production

# 4. Set start command: node server/index.js
```

Update your Vercel frontend to point API calls to the Railway URL:
```javascript
// lib/api.js — Update BASE_URL
const BASE_URL = 'https://your-app.up.railway.app/api';
```

---

## Option 2: Render (Full-Stack)

```bash
# 1. Push to GitHub

# 2. Go to https://render.com → New Web Service → Connect repo

# 3. Settings:
#    Build Command: npm install && npm run build
#    Start Command: node server/index.js
#    Environment: Node

# 4. Add environment variables:
#    PORT=3001
#    JWT_SECRET=your-strong-secret
#    NODE_ENV=production
```

Render serves both frontend (from `dist/`) and backend from the same process.

---

## Option 3: Docker Self-Host

```bash
# 1. Build and run
docker-compose up --build -d

# 2. Access at http://localhost:3001

# 3. To update
docker-compose pull && docker-compose up --build -d
```

For production, add a reverse proxy (Nginx/Caddy):
```nginx
server {
    listen 80;
    server_name agentvendi.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

---

## Option 4: VPS (Ubuntu 22.04)

```bash
# 1. SSH into your VPS
ssh root@your-server-ip

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Clone the repo
git clone https://github.com/yourusername/agentvendi.git
cd agentvendi

# 4. Install deps + build
npm install
npm run build

# 5. Set environment variables
export JWT_SECRET="your-strong-secret"
export PORT=3001
export NODE_ENV=production

# 6. Install PM2 for process management
sudo npm install -g pm2

# 7. Start the server
pm2 start server/index.js --name agentvendi

# 8. Auto-start on reboot
pm2 startup
pm2 save

# 9. Set up Caddy as reverse proxy (auto-SSL)
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy

# 10. Configure Caddy
echo "agentvendi.yourdomain.com {
  reverse_proxy localhost:3001
}" | sudo tee /etc/caddy/Caddyfile
sudo systemctl restart caddy
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3001` | Server port |
| `JWT_SECRET` | **Yes** | `agentvendi-secret...` | Change in production! |
| `NODE_ENV` | No | `development` | Set to `production` |

## Pre-Deploy Checklist

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Run `npm run build` to generate `dist/`
- [ ] Test with `NODE_ENV=production node server/index.js`
- [ ] Set up HTTPS (Caddy auto-SSL or Let's Encrypt)
- [ ] Create first admin account, then check `/admin`
