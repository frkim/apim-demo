# Demo video — Azure API Management AI Gateway

| File | Description |
| --- | --- |
| [apim-ai-gateway-demo.mp4](apim-ai-gateway-demo.mp4) | 3 min 54 s, 1920×1080, H.264 + AAC, English narration, burned-in captions |
| [apim-ai-gateway-demo.en.srt](apim-ai-gateway-demo.en.srt) | English subtitles (sidecar file) |

Every terminal screen in the video is a replay of **real output** captured from the deployed gateway
(`rg-apimaigw-demo-swc`) by running `python -m ai_gateway <scenario>`.
The narration is synthesized with **Azure AI Speech** (voice `en-US-Andrew:DragonHDLatestNeural`) on the demo's own
Foundry account, authenticated with Microsoft Entra ID — no keys.

## Rebuild the video

Prerequisites: the demo is deployed, you are signed in with `az login` with an identity that has the
**Cognitive Services Speech User** role on the Sweden Central Foundry account (the Bicep grants it to the deployment
identity), Python 3.12+, and `ffmpeg` on the PATH.

```powershell
cd video
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\python capture.py   # runs D1–D7 live and records the coloured terminal output (~5 min, includes waits)
.\.venv\Scripts\python narrate.py   # Azure AI Speech → build/audio/*.wav
.\.venv\Scripts\python render.py    # frames + ffmpeg → docs/video/apim-ai-gateway-demo.mp4 and .srt
```

Edit the narration or titles in [`video/storyboard.py`](../../video/storyboard.py).
Intermediate files go to `video/build/` (git-ignored).

## Transcript

### 00:00 — Azure API Management as your AI Gateway

> Welcome. In this short demo, you'll see Azure API Management working as an AI gateway, in front of Microsoft Foundry models and MCP tools. Everything is live. The environment was deployed with Bicep, from a GitHub Actions workflow, in Sweden Central and France Central.

### 00:16 — Demo architecture

> Here is the setup. Apps and agents call one endpoint, on an API Management Basic v2 gateway. Every request goes through a policy chain: managed identity authentication, content safety, a token budget per team, and token metrics. A load-balanced backend pool then routes it to GPT 6.1 Sol, deployed in two Microsoft Foundry projects, in Sweden Central and France Central. The same gateway also exposes our Zava retail REST API as an MCP server.

### 00:45 — D1 · Keyless chat through the gateway

On screen: `python -m ai_gateway chat` (live output captured from the deployed gateway)

> Demo one: a chat completion through the gateway, with the standard OpenAI SDK. The application only holds an API Management subscription key for the Gold team. There is no model key anywhere. The gateway authenticates to Microsoft Foundry with its managed identity, and key authentication is actually disabled on the Foundry resources. The response headers show which regional backend served the call, the tokens used, and the tokens left in the team's per-minute budget.

### 01:12 — D2 · Load balancing & failover

On screen: `python -m ai_gateway load-balance` (live output captured from the deployed gateway)

> Demo two: resiliency. Six requests are spread across the backend pool, alternating between Sweden Central and France Central. Each backend has a circuit breaker. If a region starts returning 429 or server errors, the gateway trips it for a minute, honors Retry-After, and retries the request on the healthy region. The client never notices.

### 01:34 — D3 · Token budgets per team

On screen: `python -m ai_gateway token-limit` (live output captured from the deployed gateway)

> Demo three: cost control. The Bronze marketing sandbox gets only three hundred tokens per minute. Watch the remaining tokens drop with each call, until the gateway answers 429, Too Many Requests, with a Retry-After header. At the very same moment, the Gold customer support team is still served. Each product also carries a monthly token quota, enforced by the same LLM token limit policy.

### 01:59 — D4 · Content safety with Prompt Shields

On screen: `python -m ai_gateway content-safety` (live output captured from the deployed gateway)

> Demo four: safety. A normal question goes through. But a jailbreak attempt, asking the model to ignore its instructions and reveal customer data, is blocked by Prompt Shields at the gateway, with a 403, before a single token is spent on the model. Hate, self-harm, sexual and violence categories are checked the same way, for every app, without changing any application code.

### 02:21 — D5 · REST API exposed as an MCP server

On screen: `python -m ai_gateway mcp` (live output captured from the deployed gateway)

> Demo five: MCP. Our existing Zava retail REST API was turned into an MCP server by API Management, without writing code. An MCP client initializes a session, lists two tools, search products and get order status, and calls them. Because the MCP server is an API in the gateway, it gets the same subscription keys, rate limits and telemetry as everything else.

### 02:45 — D6 · Agent: model + MCP tools, one gateway

On screen: `python -m ai_gateway agent` (live output captured from the deployed gateway)

> Demo six: an agent. We ask which outdoor products cost less than one hundred euros, and where my order is. The agent uses the Responses API. GPT 6.1 Sol, reached through the gateway, decides to call both MCP tools, also through the gateway, and composes the answer. The conversation is stateless, so each turn can be served by a different region. Model traffic and tool traffic are governed in one place.

### 03:10 — D7 · Token observability & chargeback

On screen: `python -m ai_gateway metrics` (live output captured from the deployed gateway)

> Demo seven: observability. The LLM emit token metric policy publishes prompt, completion and total tokens to Application Insights, with the product as a dimension, so you can show back or charge back AI costs per team. LLM logging stores prompts and completions in Log Analytics, ready for audits and dashboards.

### 03:29 — Key takeaways

> That's the AI gateway: keyless security, token budgets, content safety, resilient load balancing, MCP and agent governance, and token-level observability, starting at about one hundred fifty dollars a month with Basic v2. The Bicep, the GitHub Actions workflows and the demo client are in the repository, and the AI Gateway labs on GitHub take you further. Thanks for watching.
