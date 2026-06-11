# SurgeMind

AI operations agent for local businesses preparing for FIFA World Cup 2026 crowd surges.

## How It Works

SurgeMind is a MERN app with a React dashboard and an Express/MongoDB API.

1. A business owner signs up and chooses a FIFA 2026 host city.
2. Onboarding collects operating details: capacity, staff count, average ticket, hours, products, language, and alert lead time.
3. MongoDB stores users, businesses, FIFA match slots, generated alerts, and agent chat sessions.
4. The agent reads the business profile and host-city match data, calculates a surge score, estimates revenue impact, and generates an action plan.
5. The dashboard shows KPIs, alerts, calendar, analytics, and an agent chat workspace.

Gemini is optional. If `GEMINI_API_KEY` is missing or fails, the app falls back to deterministic operational plans based on the same MongoDB data.

## Stack

- Frontend: React CRA, React Router, Axios
- Backend: Express, MongoDB/Mongoose, JWT auth
- AI: Google Gemini with fallback generation
- Deployment shape: one Node service serving `frontend/build` in production

## Environment

Create `.env` in the repo root:

```bash
MONGODB_URI=mongodb+srv://...
JWT_SECRET=replace-with-at-least-32-random-characters
GEMINI_API_KEY=
PORT=3001
NODE_ENV=production
CLIENT_URL=https://your-deployed-app-url
```

For local frontend-only API override, create `frontend/.env`:

```bash
REACT_APP_API_URL=http://localhost:3001
```

For the single-service production deploy, do not set `REACT_APP_API_URL`; the frontend can call the same deployed origin.

## Local Run

```bash
npm install
npm install --prefix frontend --legacy-peer-deps
npm run seed
npm start
```

In another terminal during development:

```bash
npm run client
```

- React dev app: http://localhost:3000
- API: http://localhost:3001
- Health check: http://localhost:3001/health

## Production Build

```bash
npm run build
NODE_ENV=production npm start
```

The backend serves `frontend/build` when `NODE_ENV=production`.

## Seed Data

`npm run seed` loads 104 FIFA World Cup 2026 host-city match slots across the 16 host cities, with real venues and expected crowd estimates. Known opening fixtures are explicit; later uncertain pairings are stored as `TBD` instead of invented teams.

Run seed once against the production MongoDB database before demoing:

```bash
npm run seed
```

## Deploy Fast

Recommended: Render Web Service or Railway.

Build command:

```bash
npm install && npm run build
```

Start command:

```bash
npm start
```

Required env vars:

- `MONGODB_URI`
- `JWT_SECRET`
- `NODE_ENV=production`
- `CLIENT_URL=https://your-deployed-app-url`
- `GEMINI_API_KEY` optional but recommended

After deploy:

1. Open `/health` and confirm `{ "status": "ok" }`.
2. Run `npm run seed` once with the same production `MONGODB_URI`.
3. Sign up with a new account.
4. Complete onboarding.
5. Generate an alert.
6. Open agent chat.
7. Refresh the page and confirm the session remains active.
8. Logout and confirm protected pages redirect to sign in.

## Demo Story

Use a real signup, not shared demo credentials.

Example: a taco shop in Los Angeles or Dallas prepares for a World Cup match surge. SurgeMind reads the match slot, expected crowd, fan mix, and business profile, then generates inventory, staffing, menu/language, operations, and revenue recommendations.
