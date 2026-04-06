# PolicyMaker Formal — AI Proxy

Minimal Cloudflare Worker that proxies chat completion requests from
[PolicyMaker Formal](https://www.benjaminbdaniels.com/policymaker-formal/)
to the Harvard HDSI OpenAI-compatible endpoint.

## Architecture

```
Browser (GitHub Pages)          Cloudflare Worker              Harvard HDSI
policymaker-formal        →     policymaker-formal-proxy  →    OpenAI API
POST /chat with body            adds api-key header            /chat/completions
```

- **Frontend:** Static site on GitHub Pages — no secrets, no server
- **Proxy:** Cloudflare Worker (free tier) — adds the HDSI `api-key` header, handles CORS
- **Backend:** Harvard HDSI OpenAI gateway — institutional API key, GPT-4o-mini

## Deployed URL

```
https://policymaker-formal-proxy.bbdaniels.workers.dev/
```

## Setup (one-time)

### 1. Install wrangler

```bash
npm install -g wrangler
wrangler login   # opens browser for Cloudflare OAuth
```

### 2. Deploy the worker

```bash
cd worker/
wrangler deploy
```

### 3. Set secrets

```bash
wrangler secret put HDSI_API_KEY
# paste the Harvard HDSI institutional key (not an sk- personal key)

wrangler secret put HDSI_BASE_URL
# paste: https://go.apis.huit.harvard.edu/ais-openai-direct-limited-schools/v1
```

### 4. Configure the frontend

In PolicyMaker Formal, open the AI Assistant chat drawer → Settings:
- **Proxy URL:** `https://policymaker-formal-proxy.bbdaniels.workers.dev/`
- Leave HDSI Base URL and API Key empty (the proxy handles auth)
- **Model:** `gpt-4o-mini` (default)

## Environment variables

| Variable | Description |
|----------|-------------|
| `HDSI_API_KEY` | Harvard HDSI institutional API key (set as secret) |
| `HDSI_BASE_URL` | HDSI gateway URL (set as secret) |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins (default: `https://www.benjaminbdaniels.com,http://localhost,file://`) |

## Costs

- **Cloudflare Worker:** Free tier — 100K requests/day, unlimited bandwidth
- **HDSI / GPT-4o-mini:** ~$0.01-0.02 per 20-turn chat session, billed against Harvard HDSI credits

## Files

```
worker/
  index.js        — The entire proxy (50 lines)
  wrangler.toml   — Cloudflare Worker config
index.js          — Legacy Node.js version (for Railway/other hosts)
package.json      — Legacy Node.js package
```
