# OptiBuild AI

**Turn a commercial building into an actionable energy retrofit plan.**

OptiBuild AI is a preliminary commercial-building retrofit intelligence platform. It combines building information, utility data, AI document understanding, incentive discovery, and deterministic financial analysis to identify potentially valuable energy upgrades.

It does **not** replace a professional energy audit, engineering study, contractor quote, structural assessment, or incentive-eligibility confirmation. AI identifies promising retrofit opportunities for preliminary evaluation — it does not determine exactly what a building needs.

## Architecture

One Next.js App Router application:

- UI: React, Tailwind CSS, shadcn/ui, Recharts
- API: Next.js Route Handlers (`app/api/*`)
- Calculations: TypeScript modules under `lib/analytics` (never performed by an LLM)
- AI: optional OpenAI for utility-bill extraction and explanation (Zod-validated)
- Persistence: optional Supabase Postgres; otherwise in-memory + browser session

See [ARCHITECTURE.md](./ARCHITECTURE.md).

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

No API keys are required for the competition demo.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | No | Utility-bill extraction and recommendation explanation |
| `OPENAI_MODEL` | No | Defaults to `gpt-4.1-mini` |
| `PVWATTS_API_KEY` | No | NREL PVWatts solar yield |
| `NEXT_PUBLIC_SUPABASE_URL` | No | Persist analyses |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | No | Client Supabase (unused in MVP UI) |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Server persist; never ship to the browser |

## Demo mode

From the home page, click **Try Demo**. That runs the labeled Buffalo office scenario (25,000 sq ft, 145,000 kWh/year, 42,000 therms/year) through the real calculation engine. Results are tagged **Demo / estimated data**.

No login is required.

## API integrations

| Integration | Used for | Fallback |
| --- | --- | --- |
| OpenStreetMap Nominatim | Geocode address | User-entered fields |
| OpenAI | Bill extraction + explanation | Manual entry / template explanation |
| NREL PVWatts v8 | Solar kWh/kW | Latitude-based yield |
| Seeded NYSERDA / IRS / utility catalog | Incentive pathways | Always available; values require verification |
| Supabase | Persistence | Session memory |

## Calculation methodology

1. Build an energy baseline (kWh, therms, cost, optional EUI).
2. Screen HVAC, lighting, controls, envelope, water heating, solar, and storage with transparent heuristics.
3. Match official program *pathways* (names and URLs only — no invented rebate dollars).
4. Compute cost, modeled planning-share incentives, net cost, simple payback, annual ROI, and lifetime net in TypeScript.

Definitions:

- Net cost = max(0, project cost − incentives)
- Simple payback = net cost ÷ annual savings
- Annual ROI = annual savings ÷ net cost × 100
- Lifetime net = annual savings × assumed life − net cost

Portfolio totals apply an interactive-effects haircut because measures overlap.

## Limitations

- Screening estimates, not an audit.
- Installed costs are ranges, not quotes.
- End-use splits are typical-building heuristics.
- Incentive amounts in the financial model are planning assumptions, not awarded values.
- Roof structural capacity is not assessed.
- RAG / pgvector is scaffolded, not required for the demo.

## Tests

```bash
npm test
npm run build
```

## Deploy

1. Push the repository to GitHub.
2. Import the project in [Vercel](https://vercel.com/new).
3. Add any optional environment variables from `.env.example`.
4. (Optional) Create a Supabase project, run `supabase/schema.sql`, and add the URL + service role key.

Production start after `npm run build`:

```bash
npm start
```

## Competition script

See [DEMO_SCRIPT.md](./DEMO_SCRIPT.md).
