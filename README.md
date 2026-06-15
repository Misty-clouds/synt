# Synt — Autonomous SOC Analyst

**Splunk Agentic Ops Hackathon · Security track**

Synt is an autonomous SOC analyst. It wakes when Splunk detects something wrong,
investigates the way a senior analyst would — forming hypotheses, querying Splunk to
confirm or kill them, pivoting across entities — and hands the human a finished,
MITRE-mapped **case file** plus a proposed **response playbook** awaiting one-click
approval. From 200 raw alerts to 3 closed case files.

The demo's wow factor is a live **Reasoning Theatre**: the agent's chain of thought
streams in real time beside a force-directed investigation graph that **self-assembles**
as entities are discovered, ending in a polished PDF case file and a human-gated response.

---

## What it does

- **Detect faster** — triggers on a Splunk notable (or an injected scenario) and opens an investigation automatically.
- **Investigate autonomously** — an OODA agent runs real SPL over the **Splunk MCP Server** and reasons with **Splunk hosted models** (hypotheses, NL→SPL, narrative, MITRE mapping).
- **Automate response with a human gate** — produces a MITRE-mapped case file + PDF and a response playbook; high-confidence ransomware actions auto-execute, everything else waits for Approve/Reject.
- **Steerable** — a natural-language command box lets an analyst re-pivot a live investigation.

Four switchable attack scenarios prove it generalizes: **credential stuffing**, **insider
exfiltration**, **lateral movement**, and **ransomware staging**.

## How it maps to the judged AI capabilities

| Capability | In Synt |
|---|---|
| **AI agents for Splunk apps** | The OODA investigation engine (`packages/agent`) — the core of the product. |
| **Splunk MCP Server** | The agent's *hands*: every search + response action goes through MCP (`packages/splunk`). |
| **Splunk hosted models** | The agent's *brain*: hypothesis generation, NL→SPL, narrative, MITRE mapping. |

## Architecture

See **[`ARCHITECTURE.md`](./ARCHITECTURE.md)** and **[`architecture.svg`](./architecture.svg)**.
Splunk = data + MCP tools + hosted-model reasoning; NestJS = agent runtime + SSE;
Next.js = Reasoning Theatre; MongoDB = agent state; Cloudflare R2 = PDF case files.

## Repo layout

```
synt/
├── apps/
│   ├── web/                 # Next.js — Reasoning Theatre + case files
│   └── api/                 # NestJS — agent runtime, MCP, SSE, Mongo, R2, PDF
├── packages/
│   ├── shared/              # TS data contracts shared by web + api
│   ├── agent/               # OODA engine (runInvestigation → TraceEvents) + verify script
│   ├── splunk/              # MCP client + hosted-model wrapper + HEC ingest (+ mocks)
│   └── scenarios/           # 4 attack scenarios: seed data + ground truth
├── ARCHITECTURE.md
├── architecture.svg
├── .env.example
└── LICENSE                  # MIT
```

---

## Quick start (offline — zero external services)

The default config (`USE_MOCK_SPLUNK=true`) runs the entire product with an in-memory
Splunk, deterministic hosted-model stand-ins, an in-memory store, and local-disk PDF
storage — perfect for the demo and for graders.

```bash
pnpm install
pnpm build              # builds packages, api, web (turbo)

# Terminal 1 — API on :3001
pnpm --filter api start          # or: pnpm --filter api dev  (watch mode)

# Terminal 2 — Web on :3000
pnpm --filter web dev
```

Open **http://localhost:3000 on a laptop/desktop** (mobile shows an "open on a big
screen" notice by design). Click an **Inject scenario** card to watch a live
investigation: reasoning streams on the left, the graph self-assembles in the center,
and a case file with a PDF download + approval gate slides in when it completes.

> **Prove the soul without any UI:** `pnpm --filter @synt/agent verify` runs the OODA
> loop against all four scenarios and asserts each reaches its ground-truth root cause,
> blast radius, and MITRE techniques.

### Note on `NEXT_PUBLIC_API_URL`

The browser bundle reads the API URL at **build time**. It defaults to
`http://localhost:3001`. If your API runs elsewhere, set `NEXT_PUBLIC_API_URL` before
`pnpm --filter web build` (or before `pnpm --filter web dev`).

---

## Going live with Splunk

1. **Create a free Splunk account** and **install Splunk Enterprise** (free 60-day trial;
   Docker `splunk/splunk` is fine). Web UI on `:8000`, management API on `:8089`.
2. **Apply a Developer License** via the Splunk Developer Program (valid 6 months).
3. **Enable token auth:** Settings → Tokens → enable; create a token → `SPLUNK_TOKEN`.
4. **Create the indexes:** `synt_auth`, `synt_network`, `synt_endpoint`, `synt_cloud`
   (Settings → Indexes → New Index).
5. **Enable HEC:** Settings → Data inputs → HTTP Event Collector → create a token →
   `SPLUNK_HEC_TOKEN`; set `SPLUNK_HEC_URL` (e.g. `https://localhost:8088/services/collector/event`).
   This is how "Inject scenario" loads real data the agent then really queries.
6. **Run the Splunk MCP Server** pointed at your instance (`:8089` + the token). Capture
   its endpoint as `SPLUNK_MCP_URL` (+ `SPLUNK_MCP_TOKEN` if it requires auth). The client
   discovers the available tools at startup and wraps search + response actions.
7. **Configure hosted models:** set `SPLUNK_MODEL_ENDPOINT`, `SPLUNK_MODEL_TOKEN`,
   `SPLUNK_MODEL_NAME`. All agent reasoning routes through this wrapper.
8. Copy `.env.example` → `.env`, fill the values, set `USE_MOCK_SPLUNK=false`, and
   (optionally) set `MONGODB_URI` and the `R2_*` vars to persist state and store PDFs in R2.

```bash
cp .env.example .env   # edit, then:
pnpm build && pnpm --filter api start
```

## The four scenarios

| Scenario | Indexes | Agent concludes | MITRE |
|---|---|---|---|
| `cred_stuffing` | auth, network | Credential stuffing succeeded on `j.okafor`; MFA changed → disable_user + revoke_sessions + block_ip | T1110.004, T1078 |
| `insider_exfil` | endpoint, network, cloud | Authorized-but-anomalous exfil by `a.bello` → disable_user + block_domain + open_ticket (human-gated) | T1530, T1074, T1567 |
| `lateral_movement` | auth, endpoint, network | Active lateral movement from `host-07` via `svc-backup` → isolate + disable account | T1021, T1078, T1136 |
| `ransomware_staging` | endpoint, network | Pre-detonation ransomware on `host-19` → **auto-approved** immediate isolate + block C2 | T1490, T1486, T1071 |

`ransomware_staging` shows fast autonomous response (auto-approvable); `insider_exfil`
shows careful human-gated judgement. Seed datasets live in
[`packages/scenarios/src`](./packages/scenarios/src).

## Which response actions are live vs simulated

- **Splunk searches** are **live** over the MCP Server when `USE_MOCK_SPLUNK=false`
  (otherwise served by the deterministic in-memory mock).
- **Response actions** (`isolate_host`, `disable_user`, `block_ip`, `block_domain`,
  `revoke_sessions`, `open_ticket`) execute **live via the MCP Server only if the running
  MCP build exposes a response-action tool**. If it does not, the action is recorded as a
  **simulated** action in the store and labelled `(simulated)` in the trace and case file.
  The case-file PDF and the UI always show the true executed/simulated status.

## Scripts

| Command | Description |
|---|---|
| `pnpm build` | Build all packages + apps |
| `pnpm dev` | Run apps in watch mode (turbo) |
| `pnpm --filter @synt/agent verify` | Run the OODA loop against all 4 scenarios and assert ground truth |
| `pnpm --filter api start` | Start the API (`:3001`) |
| `pnpm --filter web dev` | Start the Theatre (`:3000`) |

## Prerequisites

- Node 20+, **pnpm**, Turborepo
- (Live mode) Splunk Enterprise trial + Developer License, Splunk MCP Server, HEC enabled,
  hosted-model access, optionally MongoDB and a Cloudflare R2 bucket.

## License

[MIT](./LICENSE)
