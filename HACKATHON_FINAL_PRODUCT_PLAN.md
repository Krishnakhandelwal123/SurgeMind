# SurgeMind Final Product Plan

Goal: make SurgeMind a deployable, judge-ready Google AI Agent Hackathon product by June 11, 2026.

## Product Thesis 

SurgeMind is an AI operations agent for local businesses near FIFA World Cup 2026 host cities. It watches match schedules, estimates crowd surges, and creates multilingual action plans for restaurants, bars, hotels, and shops before large fan traffic arrives.

Winning angle: judges should immediately see a real-world agent, not just a chatbot. The agent must use tools, inspect structured data, reason about business impact, and produce practical actions.

## Current Project Status

Already present:

- React product flow: landing, sign up, onboarding, dashboard, alerts, calendar, analytics, settings, agent chat.
- Express API with protected app routes.
- MongoDB models for users, businesses, matches, alerts, and agent sessions.
- FIFA 2026 seed data for matches, venues, cities, crowds, and fan nationalities.
- Gemini integration with fallback generation when no API key is present.
- AI agent pages that show planning, forecasting, alerts, and chat.
- Production serving path for a built React frontend from Express.

Improved in this pass:

- Removed the visible demo account from the sign-in page.
- Removed demo credentials from README.
- Updated seed data so it no longer creates demo users or deletes real users/businesses.
- Moved auth from browser localStorage tokens to HTTP-only session cookies.
- Added logout endpoint that clears the session cookie.
- Added JWT issuer/audience checks.
- Enforced production JWT secret presence and minimum length.
- Raised password minimum to 10 characters with letter and number validation.
- Added stronger email validation and duplicate email checks.
- Added lightweight rate limiting for login/register.
- Added basic security headers, production CORS allowlisting, and a smaller JSON body limit.
- Added `npm run cleanup:demo` to remove old demo users from existing databases.

## What Is Left To Win

### 1. Make the Agent Obviously Agentic

Judges need to see the agent doing work with tools.

Must finish:

- Show a visible "agent trace" on alert generation: match lookup, crowd forecast, business profile read, action plan generation, translation.
- Store every tool call in `AgentSession.toolCalls` with real input and output summaries.
- Add a "Why this alert?" panel on alert detail pages that explains the match, crowd size, fan mix, and recommended actions.
- Make the agent ask one clarifying question when business data is missing, instead of guessing silently.

Acceptance:

- A judge can generate an alert and see what data the agent used.
- The agent output is tied to real match/city/business data.
- The product does not feel like a generic Gemini wrapper.

### 2. Make Auth Production-Ready Enough

This pass hardened auth, but final polish is still needed.

Must finish:

- Add password reset flow or clearly hide/reset-disabled messaging for hackathon scope.
- Add tests for register, login, logout, `/me`, duplicate email, and bad password.

Acceptance:

- No demo login exists in code, UI, docs, or seed scripts.
- Tokens are not stored in localStorage.
- Bad auth paths return clean errors.
- Deployed app works after browser refresh.

### 3. Make Onboarding Create a Strong Business Profile

The agent can only be as specific as the profile.

Must finish:

- Collect typical daily capacity, staff count, opening hours, top products/services, and preferred alert lead time.
- Add profile fields to the `Business` model.
- Use those fields in the agent prompt.
- Show a "profile completeness" indicator in settings.

Acceptance:

- A restaurant alert mentions inventory, staffing, language/menu needs, and expected revenue range.
- A hotel alert mentions rooms, check-in surge, staffing, and local partnerships.
- A bar alert mentions staffing, stock, hours, and match-day specials.

### 4. Improve Alert Quality

Must finish:

- Add clear alert severity: Low, Medium, High, Critical.
- Add checklist categories: Inventory, Staffing, Pricing, Marketing, Language, Operations.
- Add due dates to checklist items based on match date.
- Add estimated revenue range explanation.
- Add multilingual output toggle or regenerate option.

Acceptance:

- Alert pages are actionable within 30 seconds.
- Checklist items are specific enough for a business owner to execute.
- Revenue estimate looks explainable, not random.

### 5. Make the Dashboard Demo-Proof

Must finish:

- Remove fallback fake KPIs such as hardcoded revenue defaults unless clearly labeled.
- Add empty states for new accounts with "Generate first alert".
- Add loading and error states for every dashboard API call.
- Ensure mobile dashboard is readable.
- Add a seeded "sample data mode" only if it is clearly not an auth demo account.

Acceptance:

- A newly registered user can complete onboarding and reach a useful dashboard.
- The dashboard does not break if no alerts exist yet.
- Judges do not need shared credentials.

### 6. Deployment Readiness

Must finish:

- Build frontend successfully with `npm run build --prefix frontend`.
- Add production env documentation:
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `GEMINI_API_KEY`
  - `CLIENT_URL`
  - `NODE_ENV=production`
  - `PORT`
- Decide deployment shape:
  - Single service: build React and serve it from Express.
  - Split services: Render API plus Vercel frontend.
- If split services, verify production cookie settings work with cross-site HTTPS.
- Add a `/health` endpoint check to deployment docs.
- Add a final production smoke test checklist.

Acceptance:

- Fresh user sign up works on deployed URL.
- Refresh keeps the user logged in.
- Generate alert works.
- Agent chat works.
- Logout works.

## Recommended 10-Day Execution Order

Day 1:

- Finish auth cleanup and verify locally.
- Remove all demo-account references.
- Add auth API tests.

Day 2:

- Add business profile fields and onboarding UI updates.
- Feed profile data into agent prompts.

Day 3:

- Improve alert schema with severity, due dates, and categorized checklist items.
- Update alert detail UI.

Day 4:

- Add visible agent trace and "Why this alert?" explanations.
- Persist real tool calls.

Day 5:

- Polish dashboard empty states, loading states, and errors.
- Remove fake fallback metrics from authenticated views.

Day 6:

- Add security headers, rate limiting, production CORS, and body limits.
- Run auth and API tests.

Day 7:

- Deploy staging.
- Fix cookie/CORS/build issues.

Day 8:

- Record the demo path locally and on staging.
- Tighten UI copy and visual polish.

Day 9:

- Create Devpost content, screenshots, and demo video.
- Make GitHub README judge-friendly.

Day 10:

- Final smoke test.
- Submit early.

## Demo Story

Use one user-created account, not shared credentials.

Scenario:

Maria owns a taco shop in Dallas. The World Cup schedule shows a major Argentina vs Mexico match nearby with tens of thousands of fans. SurgeMind detects the match, estimates the surge, and gives Maria a Spanish-ready action plan: stock ingredients, schedule staff, add fan bundles, prepare translated signage, and time promotions before the crowd arrives.

Three-minute demo:

1. Show the problem: local businesses miss revenue because crowd surges are predictable but hard to operationalize.
2. Sign up and onboard Maria's business.
3. Generate a surge alert for Dallas.
4. Show the agent trace and match data used.
5. Show checklist, revenue estimate, language-specific recommendations, and calendar.
6. Ask the agent a follow-up question, such as "What should I do 48 hours before the match?"
7. End with impact: "SurgeMind turns city-scale events into local-business action plans."

## Final Submission Checklist

- Live deployed URL.
- Public GitHub repository with no `.env`.
- README includes setup, env vars, product story, and architecture.
- Demo video under 3 minutes.
- Screenshots: landing, dashboard, alert detail, agent trace, calendar.
- Devpost tagline: "AI agent that warns local businesses before FIFA crowd surges arrive."
- Mention Google Gemini clearly.
- Mention MongoDB/tool usage clearly.
- Mention real FIFA 2026 host-city data clearly.

## Technical Risks To Watch

- Cross-site auth cookies can fail if deployed API and frontend are on different domains without HTTPS and `SameSite=None`.
- Gemini API failures should produce useful fallback alerts, but the UI should label them as generated plans, not fake live data.
- Seed scripts must never delete user/business data in production.
- Hardcoded fallback numbers can look suspicious to judges if they appear as real analytics.
- Agent trace must show tool-backed reasoning without exposing secrets or raw tokens.

## Immediate Next Commands

Run these locally before deploying:

```bash
npm run seed
npm start
npm run client
npm run build --prefix frontend
```

Then manually verify:

- Create account with a strong password.
- Complete onboarding.
- Refresh the browser and confirm the session remains active.
- Generate an alert.
- Open agent chat.
- Logout and confirm protected pages redirect to sign in.
