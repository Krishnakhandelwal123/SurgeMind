# SurgeMind

AI agent platform helping local businesses prepare for FIFA World Cup 2026 crowd surges.

## Stack

- **Frontend:** React (CRA), React Router, dark SurgeMind design system
- **Backend:** Express, MongoDB, JWT auth, Google Gemini (optional)
- **Flow:** Landing → Sign up → Onboarding → Dashboard (alerts, agent, calendar, analytics, settings)

## Quick start

### 1. Environment

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

Edit `.env` and set `MONGODB_URI` (local MongoDB or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier).

Optional: add `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/) for live AI plans. Without it, the app uses high-quality fallback plans.

### 2. Install & seed

```bash
npm install
cd frontend && npm install --legacy-peer-deps && cd ..
npm run seed
```

### 3. Run

```bash
# Terminal 1 — API
npm start

# Terminal 2 — React app
npm run client
```

- App: http://localhost:3000  
- API: http://localhost:3001  

**Demo account:** `demo@surgemind.ai` / `demo1234`

## API overview

| Endpoint | Auth | Description |
|----------|------|-------------|
| `POST /api/auth/register` | — | Create account + business |
| `POST /api/auth/login` | — | JWT login |
| `GET /api/auth/me` | ✓ | Current user + business |
| `GET /api/dashboard` | ✓ | Overview KPIs, timeline, map |
| `GET /api/alerts` | ✓ | List alerts |
| `POST /api/generate-alert` | ✓ | AI surge plan (Gemini or fallback) |
| `POST /api/agent/chat` | ✓ | Agent conversation |
| `GET /api/analytics` | ✓ | Charts data |
| `GET /api/matches/calendar/:y/:m` | ✓ | Calendar matches |

## Production

```bash
cd frontend && npm run build && cd ..
NODE_ENV=production npm start
```

Serve the React build from Express on a single port.
