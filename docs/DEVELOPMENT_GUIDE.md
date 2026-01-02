# Development & Deployment Guide

## Project Setup

### 1. Initialize the Project

```bash
# From repository root
mkdir frontend
cd frontend

# Create Vite React TypeScript project
npm create vite@latest . -- --template react-ts

# Install dependencies
npm install

# Install additional packages
npm install pocketbase react-router-dom date-fns
npm install -D tailwindcss postcss autoprefixer daisyui @types/node
```

### 2. Configure Tailwind CSS

```bash
npx tailwindcss init -p
```

Update `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["light", "dark", "night"],
    darkTheme: "night",
  },
}
```

Update `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 3. Configure TypeScript Path Aliases

Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Update `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
})
```

### 4. Project Structure

```
frontend/
├── public/
│   ├── favicon.ico
│   ├── placeholder-activity.jpg
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   ├── PageContainer.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── activities/
│   │   │   ├── ActivityCard.tsx
│   │   │   ├── ActivityList.tsx
│   │   │   ├── CreateActivityModal.tsx
│   │   │   └── ParticipantList.tsx
│   │   ├── ranking/
│   │   │   ├── RankingList.tsx
│   │   │   └── RankingItem.tsx
│   │   ├── news/
│   │   │   ├── NewsList.tsx
│   │   │   └── NewsCard.tsx
│   │   ├── admin/
│   │   │   ├── AdminActivityList.tsx
│   │   │   ├── PointsForm.tsx
│   │   │   └── NewsManager.tsx
│   │   └── common/
│   │       ├── Avatar.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorMessage.tsx
│   │       └── EmptyState.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   ├── useActivities.ts
│   │   ├── useParticipations.ts
│   │   ├── useRanking.ts
│   │   └── useNews.ts
│   ├── lib/
│   │   ├── pocketbase.ts
│   │   └── utils.ts
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── ActivitiesPage.tsx
│   │   ├── ActivityDetailPage.tsx
│   │   ├── RankingPage.tsx
│   │   ├── ProfilePage.tsx
│   │   └── AdminPage.tsx
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env
├── .env.example
├── .gitignore
├── Dockerfile
├── nginx.conf
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## Environment Variables

Create `.env`:
```bash
VITE_POCKETBASE_URL=https://matenweekend.nl
```

Create `.env.example`:
```bash
VITE_POCKETBASE_URL=https://matenweekend.nl
```

Update `src/lib/pocketbase.ts`:
```typescript
import PocketBase from 'pocketbase';

const pocketbaseUrl = import.meta.env.VITE_POCKETBASE_URL || 'https://matenweekend.nl';

export const pb = new PocketBase(pocketbaseUrl);
```

---

## Local Development

```bash
cd frontend

# Start development server
npm run dev

# The app will be available at http://localhost:3000
# It will connect to the production PocketBase at matenweekend.nl
```

---

## Building for Production

```bash
# Build the app
npm run build

# Preview production build locally
npm run preview
```

---

## Docker Configuration

Create `frontend/Dockerfile`:
```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

Create `frontend/nginx.conf`:
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Handle SPA routing - always serve index.html for non-file requests
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check endpoint
    location /health {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
```

Create `frontend/.dockerignore`:
```
node_modules
dist
.git
.gitignore
*.md
.env.local
.env.*.local
```

---

## GitHub Actions CI/CD

Create `.github/workflows/deploy.yml` (in repository root):
```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'
      - '.github/workflows/deploy.yml'

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}-frontend

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=
            type=raw,value=latest

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: 46.62.164.62
          username: root
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/matenweekend
            
            # Pull the new image
            docker pull ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
            
            # Update docker-compose.yml if needed
            # Then restart the frontend container
            docker compose pull frontend
            docker compose up -d frontend
            
            # Clean up old images
            docker image prune -f
```

---

## Server Configuration

### Update docker-compose.yml on server

Add the frontend service to `/opt/matenweekend/docker-compose.yml`:

```yaml
version: '3.8'

services:
  pocketbase:
    image: ghcr.io/muchobien/pocketbase:latest
    container_name: pocketbase
    restart: unless-stopped
    volumes:
      - ./pb_data:/pb_data
      - ./pb_hooks:/pb_hooks
    expose:
      - 8080
    command: serve --http=0.0.0.0:8080
    networks:
      - matenweekend

  frontend:
    image: ghcr.io/YOUR_GITHUB_USERNAME/matenweekend-frontend:latest
    container_name: frontend
    restart: unless-stopped
    expose:
      - 80
    networks:
      - matenweekend

  caddy:
    image: caddy:2-alpine
    container_name: caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - pocketbase
      - frontend
    networks:
      - matenweekend

  portainer:
    image: portainer/portainer-ce:latest
    container_name: portainer
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - portainer_data:/data
    expose:
      - 9000
    networks:
      - matenweekend

networks:
  matenweekend:
    driver: bridge

volumes:
  caddy_data:
  caddy_config:
  portainer_data:
```

### Update Caddyfile

```
matenweekend.nl {
    # PocketBase API and Admin
    handle /_/* {
        reverse_proxy pocketbase:8080
    }
    handle /api/* {
        reverse_proxy pocketbase:8080
    }
    
    # Frontend
    handle {
        reverse_proxy frontend:80
    }
}

portainer.matenweekend.nl {
    reverse_proxy portainer:9000
}
```

---

## GitHub Setup

### 1. Create Repository Secret for SSH

1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Add new secret: `SSH_PRIVATE_KEY`
3. Paste your SSH private key (the one that can access the server)

### 2. Enable GitHub Container Registry

The workflow automatically uses GitHub Container Registry (ghcr.io).
Make sure your repository has packages enabled.

---

## First Deployment

### Manual first-time setup on server:

```bash
ssh root@46.62.164.62

cd /opt/matenweekend

# Update docker-compose.yml with frontend service
nano docker-compose.yml

# Update Caddyfile to serve frontend
nano Caddyfile

# Log in to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Pull and start all services
docker compose pull
docker compose up -d

# Check logs
docker compose logs -f frontend
```

---

## Development Workflow

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/activity-list
   ```

2. **Develop locally:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test the build:**
   ```bash
   npm run build
   npm run preview
   ```

4. **Push and deploy:**
   ```bash
   git add .
   git commit -m "Add activity list component"
   git push origin feature/activity-list
   ```

5. **Create PR and merge to main** - deployment happens automatically

---

## Useful Commands

```bash
# Local development
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Docker (local testing)
docker build -t matenweekend-frontend ./frontend
docker run -p 3000:80 matenweekend-frontend

# Server
docker compose logs -f frontend    # View frontend logs
docker compose restart frontend    # Restart frontend
docker compose pull frontend       # Pull latest image
```

---

## Troubleshooting

### CORS Issues
PocketBase should be configured to allow requests from the frontend domain.
Check PocketBase admin → Settings → Application.

### 404 on Page Refresh
This is a SPA routing issue. The nginx.conf includes the fix:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Auth Token Not Persisting
PocketBase SDK stores auth in localStorage by default.
Check browser dev tools → Application → Local Storage.

### Images Not Loading
Make sure the file URL is constructed correctly:
```typescript
pb.files.getUrl(record, record.fieldName)
```
