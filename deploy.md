## Deploying idea-drop (Frontend + Backend)

This guide covers production deployment for both the backend (`idea-drop-api`) and frontend (`idea-drop-ui`) using Bun.

### Prerequisites

- Bun installed (recommended): `curl -fsSL https://bun.sh/install | bash`
- A MongoDB database (MongoDB Atlas or self-hosted)

### Environment Variables

Backend (`idea-drop-api`):

- `MONGO_URI`: Mongo connection string
- `JWT_SECRET`: Secret for signing JWTs
- `PORT` (optional): Defaults to `8888`
- CORS origin is currently hardcoded; update it to your frontend URL in `idea-drop-api/server.js` (see CORS section below)

Frontend (`idea-drop-ui`):

- `VITE_API_URL`: Base URL of the backend (e.g. `https://api.example.com` or `https://your-render-service.onrender.com`)

Create a `.env` file in each app or configure env vars on your hosting provider.

---

## Backend: idea-drop-api

### Local production run (for verification)

```bash
cd idea-drop-api
bun install
MONGO_URI="<your-uri>" JWT_SECRET="<your-secret>" PORT=8888 bun run server.js
```

### Deploy options

#### Render (recommended quick start)

1. Push this repo to GitHub.
2. In Render, create a new Web Service pointing to `idea-drop-api` directory.
3. Environment:
   - Runtime: Use Docker or Native Bun environment (Render supports Bun via Docker reliably)
   - Build Command: `bun install`
   - Start Command: `bun run server.js`
4. Set env vars: `MONGO_URI`, `JWT_SECRET`, and optionally `PORT`.
5. Update frontend `VITE_API_URL` to the Render service URL.

#### Fly.io (Bun + Docker)

1. Add a minimal `Dockerfile` (example below) in `idea-drop-api`.
2. Run `fly launch` and follow prompts.

Example `Dockerfile`:

```dockerfile
FROM oven/bun:1 as base
WORKDIR /app
COPY bun.lock package.json ./
RUN bun install --frozen-lockfile
COPY . .
CMD ["bun", "run", "server.js"]
```

#### Other platforms

- Railway/Heroku-like: set Build `bun install`, Start `bun run server.js`.
- Kubernetes: containerize with the Dockerfile above.

### CORS configuration (important)

Production CORS should allow your deployed frontend origin. In `idea-drop-api/server.js`, update:

```js
const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
};
```

to your frontend URL, e.g.:

```js
const corsOptions = {
  origin: 'https://your-frontend.example.com',
  credentials: true,
};
```

For multiple origins, use a function:

```js
const allowed = ['http://localhost:3000', 'https://your-frontend.example.com'];
const corsOptions = {
  origin: (origin, cb) => cb(null, !origin || allowed.includes(origin)),
  credentials: true,
};
```

---

## Frontend: idea-drop-ui

### Build for production

```bash
cd idea-drop-ui
bun install
VITE_API_URL="https://your-backend.example.com" bunx --bun run build
# Output in dist/
```

### Preview locally (optional)

```bash
bunx --bun run serve
# serves dist/ on a local port
```

### Deploy options

#### Vercel

1. Import the repo, set the project root to `idea-drop-ui`.
2. Build Command: `bunx --bun run build`
3. Output Directory: `dist`
4. Set env var `VITE_API_URL`.

#### Netlify

1. New site from Git, base directory `idea-drop-ui`.
2. Build Command: `bunx --bun run build`
3. Publish Directory: `dist`
4. Environment variable: `VITE_API_URL`.

#### Cloudflare Pages

1. Create a project, set root `idea-drop-ui`.
2. Build Command: `bunx --bun run build`
3. Build Output Directory: `dist`
4. Environment variable: `VITE_API_URL`.

#### Static hosting (any)

Build locally and upload the `dist/` folder to any static host or S3+CDN.

---

## End-to-end checklist

- Backend deployed and reachable over HTTPS
- Backend env vars set: `MONGO_URI`, `JWT_SECRET`, optional `PORT`
- CORS in backend updated to your frontend URL
- Frontend built with `VITE_API_URL` pointing to backend origin
- Frontend deployed; verify auth flows and idea CRUD work

## Useful commands

```bash
# API
cd idea-drop-api && bun install && bun run server.js

# UI
cd idea-drop-ui && bun install && bunx --bun run build && bunx --bun run serve
```

---

## Deploy with Dokploy (single shot: frontend + backend)

Deploy both `idea-drop-api` and `idea-drop-ui` together on Dokploy using native Docker Compose support. Dokploy runs Traefik for routing and offers UI to manage env vars, domains, logs, and rollbacks. See Dokploy site for features and install: `https://dokploy.com/`.

### 1) Add Dockerfiles

Create a `Dockerfile` in each app directory.

Backend `idea-drop-api/Dockerfile`:

```dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

# Install deps
COPY bun.lock package.json ./
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Run the API with Bun
ENV PORT=8888
EXPOSE 8888
CMD ["bun", "run", "server.js"]
```

Frontend `idea-drop-ui/Dockerfile`:

```dockerfile
# Build stage
FROM oven/bun:1 AS build
WORKDIR /app

COPY bun.lock package.json ./
RUN bun install --frozen-lockfile

COPY . .

# Inject API base URL at build time
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Uses the existing package script
RUN bun run build

# Serve static files with Nginx (simple, fast)
FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

Notes:

- Backend uses Bun runtime image only.
- Frontend builds with Bun, then serves static assets via Nginx (non-Node). If you prefer Bun-only serving, replace the runtime stage with `oven/bun` and use a minimal static file server.

### 2) Add a root Docker Compose file

Create `docker-compose.dokploy.yml` at the repository root:

```yaml
version: '3.9'
services:
  api:
    build:
      context: ./idea-drop-api
      dockerfile: Dockerfile
    container_name: idea-drop-api
    env_file:
      - ./idea-drop-api/.env
    environment:
      # Fallbacks if not provided via env_file / Dokploy UI
      - PORT=8888
    ports:
      # Dokploy/Traefik can attach domains; exposing is optional but useful for quick checks
      - '8888:8888'
    restart: unless-stopped

  ui:
    build:
      context: ./idea-drop-ui
      dockerfile: Dockerfile
      args:
        # Passed at build-time so Vite embeds the correct API URL
        VITE_API_URL: ${VITE_API_URL}
    container_name: idea-drop-ui
    depends_on:
      - api
    ports:
      - '8080:80'
    restart: unless-stopped

# Optional named volumes (none needed for this app)
volumes: {}
```

Environment configuration:

- Backend (`idea-drop-api/.env`): set `MONGO_URI`, `JWT_SECRET`, optional `PORT`.
- Frontend build arg: set `VITE_API_URL` (e.g. `https://api.your-domain.com`). You can set this in Dokploy UI as a build arg or repo-level env.

### 3) Prepare environment files (recommended)

Create `idea-drop-api/.env` with:

```bash
MONGO_URI="<your-mongodb-uri>"
JWT_SECRET="<a-long-random-secret>"
PORT=8888
```

You may also set these directly in Dokploy’s UI instead of using `.env`.

### 4) Deploy on Dokploy

1. Install or access Dokploy. See `https://dokploy.com/` for install and features.
2. In Dokploy UI, create a Project (e.g., `idea-drop`).
3. Add a new Application → choose Docker Compose.
4. Point it to your Git repository and select the root directory.
5. In the Compose configuration, use `docker-compose.dokploy.yml` (if Dokploy asks for the file name/path).
6. Set environment values:
   - For `api`: `MONGO_URI`, `JWT_SECRET`, optional `PORT`.
   - For `ui` build args: set `VITE_API_URL` to the public URL of the API (you can initially point to the service URL that Dokploy assigns to `api`, then later switch to your domain).
7. Deploy.
8. After the first deploy, assign domains in Dokploy:
   - Map a domain/subdomain to the `api` service (e.g., `api.your-domain.com`).
   - Map a domain/subdomain to the `ui` service (e.g., `app.your-domain.com`).

### 5) CORS reminder

In `idea-drop-api/server.js`, ensure CORS `origin` includes your frontend domain (see the CORS section above). Example allowed origins:

```js
const allowed = ['http://localhost:3000', 'https://app.your-domain.com'];
const corsOptions = {
  origin: (origin, cb) => cb(null, !origin || allowed.includes(origin)),
  credentials: true,
};
```

### 6) Health checks and troubleshooting

- Logs: Use Dokploy UI → Application → Logs to view `api` and `ui` output.
- Rebuilds: If you change `VITE_API_URL`, trigger a rebuild/redeploy of `ui` so the new value is embedded.
- Zero-downtime: Dokploy handles rolling updates; confirm containers become healthy before switching traffic.

### Quick local verification (optional)

Run Compose locally to simulate the Dokploy stack:

```bash
VITE_API_URL="http://localhost:8888" docker compose -f docker-compose.dokploy.yml up --build
# UI → http://localhost:8080
# API → http://localhost:8888
```

Reference: Dokploy features and installation are described on their site: [`https://dokploy.com/`](https://dokploy.com/)
