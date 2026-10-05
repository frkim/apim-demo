# Azure API Management — AI Gateway Research Brief
**Compiled:** October 3, 2026 · Scope: latest APIM platform features with emphasis on AI Gateway (GenAI) capabilities, the `Azure-Samples/AI-Gateway` lab catalog, pricing, limits, and demo-ready Bicep/policy syntax.

---

## 1. What's new (dated)

Azure API Management's AI Gateway surface has shipped rapidly through 2026. Key dated changes, per Microsoft Learn `ms.date` / `updated_at` metadata and the AI-Gateway repo:

| Date | Change |
|---|---|
| 2025 Ignite / 2026 ongoing | **MCP server support** (`mcp-server-overview`, last updated **2026‑09‑11**) — expose REST APIs as MCP servers or pass through existing MCP servers; tools-only (no resources/prompts yet); not supported inside **workspaces**. |
| 2026‑09‑16 | **Workspaces** extended to **Basic v2 and Standard v2** (previously Premium/Premium v2 only) — "federated" API management with per-team RBAC and optional workspace gateways. |
| 2026‑09‑04 | **v2 tiers overview** refreshed — Premium v2 scale-out to **30 units**; Basic v2/Standard v2 to **10 units**; confirms **Premium v2 GA** (see TechCommunity GA announcement). |
| 2026‑08‑18 | **`llm-content-safety`** policy extended to also protect **MCP tool calls and A2A agent API** traffic, not just chat completions. |
| 2026‑06‑25 / 2026‑05‑29 | **`genai-gateway-capabilities`** rewritten to cover: unified model API, Microsoft Foundry AI-gateway integration, MCP + A2A as first-class AI endpoint types, and the **AI Gateway Early release channel**. |
| 2026 (preview, rolling out) | **Unified model API (preview)** — a single OpenAI-Chat-Completions-shaped endpoint (`/llm/v1/chat/completions`) that fronts multiple OpenAI- or Anthropic-format backends with automatic format translation, model aliasing, and failover. |
| 2026 (preview) | **AI gateway in Microsoft Foundry** — APIM can now be attached directly inside a Foundry project/resource to govern model deployments, registered agents (anywhere), and MCP tools from the Foundry control plane. |
| 2026‑09‑17 | **`llm-emit-token-metric`** updated: token metrics now include (in preview) **cached, reasoning, and "thinking"** token categories, not just prompt/completion. |
| 2026‑06‑23 | **Programmatic MCP server management** documented — MCP servers are modeled as API resources of `type: 'mcp'`; **tool sub-resources** (`api-tool`) can be added/renamed/removed independently via REST/Bicep/Terraform without recreating the server. Requires **API Management REST API `2025-09-01-preview`** or later. |
| March 2026 | **Revised APIM service limits** took effect (API operations, tags, named values, products, subscriptions, users — see §5); existing services keep prior capacity. |
| Continuous | **AI-Gateway Dev Portal** (`aka.ms/ai-gateway/dev-portal`) launched — a forkable starter developer portal built on top of the AI Gateway; **50+ hands-on labs** now live in `Azure-Samples/AI-Gateway` (repo markets "30+", actual lab count as of Oct 2026 is 50, see §3), plus a Feb 2026 **"Enterprise AI Gateway" e-book** and new **Copilot Agent Skills** (`lab-creator`, `apim-bicep`, `apim-terraform`, `apim-policies`, `apim-kql`, `mcp-builder`) to scaffold new labs with AI assistance. |

Sources: [azure.github.io/api-management-resources](https://azure.github.io/api-management-resources/) (apimlove), [genai-gateway-capabilities](https://learn.microsoft.com/en-us/azure/api-management/genai-gateway-capabilities), [mcp-server-overview](https://learn.microsoft.com/en-us/azure/api-management/mcp-server-overview), [v2-service-tiers-overview](https://learn.microsoft.com/en-us/azure/api-management/v2-service-tiers-overview), [workspaces-overview](https://learn.microsoft.com/en-us/azure/api-management/workspaces-overview), [GitHub: Azure-Samples/AI-Gateway](https://github.com/Azure-Samples/AI-Gateway).

**apimlove site note:** `azure.github.io/api-management-resources/` renders as a lightweight hub page summarizing "Azure API Management is a hybrid, multicloud platform... API gateway, management plane, and developer portal." The page is primarily a landing/redirect hub (curated by the APIM product-engineering community, badge "APIM Love") pointing to blogs, samples, and the AI-Gateway repo rather than a long-form article in itself; its static content did not expose a dated changelog at fetch time.

---

## 2. AI Gateway capabilities in Azure API Management

Per [genai-gateway-capabilities](https://learn.microsoft.com/en-us/azure/api-management/genai-gateway-capabilities) (**APPLIES TO: All API Management tiers** for the overarching concept; individual features vary by tier):

### 2.1 Endpoint types the AI gateway manages
- **Language model APIs**: OpenAI Chat Completions or **Responses API**, **Anthropic Messages API** (v2 tiers only, currently), **Google Vertex AI API**. Backends: Microsoft Foundry, non-Microsoft providers (e.g., **Amazon Bedrock**, **Google Gemini**).
- **Unified model API (preview)** — one OpenAI-compatible endpoint in front of multiple backends, with automatic request/response format translation and a `/models` discovery endpoint.
- **Remote MCP servers** and **A2A agent APIs**.
- **Self-hosted models/endpoints** (e.g., Ollama).

### 2.2 Traffic mediation & onboarding
- Portal wizards import Microsoft Foundry models or OpenAI-compatible/passthrough LLM endpoints, preconfiguring managed-identity auth and baseline policies.
- Govern **chat completions, Responses API, and Realtime API** traffic uniformly.
- **Expose REST APIs as MCP servers** or **pass through existing MCP servers** (LangChain, LangServe, Logic Apps, Functions, etc.).
- **Import A2A agent APIs** (Agent2Agent protocol) — mediates JSON-RPC, rewrites the **agent card** (hostname, transport, security requirements) to point through APIM, and emits OpenTelemetry GenAI attributes (`genai.agent.id`, `genai.agent.name`).

### 2.3 Scalability & performance
- **Token rate limiting & quotas** — `llm-token-limit` (model-agnostic) and the legacy `azure-openai-token-limit` (Azure OpenAI-specific) policies cap tokens-per-minute and/or a quota (hourly/daily/weekly/monthly/yearly), keyed by subscription, IP, or any policy expression. Supports prompt-token pre-estimation to reject over-budget calls before they reach the backend.
- **Semantic caching** — `llm-semantic-cache-lookup` / `llm-semantic-cache-store` (+ legacy `azure-openai-semantic-cache-lookup/store`) use an Embeddings API and an external Redis-compatible cache (e.g., **Azure Managed Redis**) to reuse semantically similar completions.
- **Native gateway scaling** — manual/automatic scale units, multi-region gateways (Premium classic only).

### 2.4 Security & safety
- **Managed identity** auth to AI backends (no API keys) via `authentication-managed-identity` or backend-level managed-identity credentials.
- **OAuth** for AI apps/agents via API Management's **credential manager**.
- **`llm-content-safety`** policy — routes prompts/completions to **Azure AI Content Safety**, blocking on harm categories (Hate/SelfHarm/Sexual/Violence, 4- or 8-severity-level), custom blocklists, and prompt-shield (jailbreak/attack) detection. As of Aug 2026 it also covers **MCP tool calls and A2A agent traffic**.

### 2.5 Resiliency
- **Backends** encapsulate backend service info, enable **load-balanced pools** (round-robin, weighted, priority-based, with optional **session awareness**/session affinity — useful for Assistants-API thread continuity), and **circuit breaker** rules (trip on count/percentage of failures in an interval + status-code range; honors backend `Retry-After`, critical for Azure OpenAI 429 handling).
- Pools support up to **30 backends**; circuit breaker currently limited to **one rule per backend** and is **not available in the Consumption tier**.

### 2.6 Observability & governance
- `llm-emit-token-metric` (model-agnostic) / `azure-openai-emit-token-metric` (legacy) push custom token metrics (prompt/completion/total, and in preview: cached/reasoning/thinking) to Application Insights with up to **5 custom dimensions**.
- **Prompt/completion logging** to Azure Monitor + a built-in analytics workbook for token-consumption patterns.
- **Azure API Center** integration: register APIs/MCP servers/agents in an org catalog, synchronize APIM↔API Center, expose a developer portal, and connect to **Copilot Studio**.

### 2.7 AI gateway in Microsoft Foundry (preview)
APIM can be attached to a Foundry project as its AI gateway, letting you configure token quotas/rate limits on model deployments directly from the Foundry UI, register agents running anywhere (Azure, other clouds, on-prem) for centralized telemetry/governance, and register MCP tools for automatic discovery by Foundry agents — while still allowing a "break-glass" drop into the full APIM portal for advanced policies/networking.

### 2.8 MCP server specifics
- Two creation modes: **"REST API as MCP server"** (operations → tools) and **"Existing MCP server"** (passthrough to an external MCP-compatible backend, declaring backend URL + transport: Streamable HTTP `/mcp` or deprecated SSE `/sse`+`/messages`).
- Resource model (ARM): an MCP server = an **API** resource with `type: 'mcp'`; tools = **API Tool** sub-resources; policies = standard API/operation policy sub-resources; product binding is a separate `products/{id}/apis/{mcpServerId}` relationship — all independently manageable from CI/CD.
- Governance: rate-limit/quota, JWT auth (Entra ID or other IdP), IP filtering, response caching — policies apply to **all tools in the server** (not per-tool, currently).
- **Do not** read `context.Response.Body` in MCP server policies — it forces response buffering and breaks the required streaming behavior.
- Supported tiers: **Developer, Basic, Standard, Premium, Basic v2, Standard v2, Premium v2** (not Consumption). Self-hosted gateway can also serve MCP. **Not supported in workspaces.**

---

## 3. AI-Gateway labs catalog (`Azure-Samples/AI-Gateway`)

As of October 2026 the repo contains **50 active labs** under `labs/` (plus a `labs/_deprecated/` folder for retired labs). Each lab is self-contained: a Jupyter notebook (`<lab>.ipynb`), `main.bicep`, `policy.xml`, a `README.MD` (YAML front matter with `categories`/`services` tags), and a `clean-up-resources.ipynb`. The repo's own taxonomy (from README front matter) uses five categories: **Models Usage, Knowledge & Tools, AI Agents, Governance & Responsible AI, Platform Capabilities** — mapped below to the requested groupings.

### Models / LLM
| Lab folder | One-liner |
|---|---|
| `aigw-foundry-models` | Catalog/gateway pattern for governing multiple Microsoft Foundry model deployments through one inference API. |
| `ai-foundry-model-gateway` | Model-agnostic gateway in front of several Foundry deployments (precursor/companion to the unified model API). |
| `ai-foundry-deepseek` | Access DeepSeek models hosted in Microsoft Foundry through APIM. |
| `aws-bedrock` | Multi-cloud: expose Claude/Llama/other **AWS Bedrock** models through the Azure gateway with unified auth. |
| `azure-ml-models` | Front **Azure Machine Learning** endpoints with the AI gateway. |
| `gemini-models` / `google-gemini-api` | Native **Google Gemini** API *and* an OpenAI-compatible shim, both served through APIM. |
| `image-generation` | Govern Azure OpenAI **DALL‑E** image generation (size/quality controls, cost/rate limiting). |
| `model-routing` | Route requests across multiple models/providers by policy logic. |
| `realtime-audio` | Azure OpenAI **Realtime API** (speech-to-speech) via APIM. |
| `secure-responses-api` | Govern the OpenAI **Responses API** with APIM security policies. |
| `message-storing` | Manage Responses-API conversation/message persistence through the gateway. |
| `serverless-gpu` | Serverless GPU-backed inference fronted by APIM. |
| `self-hosted-ollama` | Expose a self-hosted **Ollama** (open-weight LLM) backend via APIM. |
| `slm-self-hosting` | Self-host small language models (SLMs) behind the AI gateway. |
| `ghcp-byok-foundry` | Bring-your-own-key GitHub Copilot ↔ Foundry model access pattern. |
| `foundry-models-evals` | Run model evaluations against Foundry-hosted deployments. |

### MCP
| Lab folder | One-liner |
|---|---|
| `model-context-protocol` | Foundational MCP lab — stand up an MCP server and connect MCP clients through APIM. |
| `mcp-from-api` | **Transform an existing REST API into an MCP server** (weather, product-catalog, place-order APIs become MCP tool servers; includes a passthrough to the public Microsoft Learn MCP server). |
| `mcp-from-graphql` | Expose a **GraphQL** API as an MCP server. |
| `mcp-client-authorization` | APIM acts as **both OAuth client and authorization server** for the MCP client-authorization flow. |
| `mcp-prm-oauth` | Production-grade MCP OAuth using **Protected Resource Metadata (RFC 9728)**. |
| `mcp-registry-apic` | Register/discover MCP servers in the **Azure API Center** registry. |
| `mcp-registry-apic-github-workflow` | Sync MCP servers into API Center via a **GitHub Actions** workflow. |
| `ai-foundry-private-mcp` | Network-isolated (private) MCP server integrated with Foundry. |
| `gemini-mcp-agents` | Gemini-backed agents consuming MCP tools through APIM. |

### Agents
| Lab folder | One-liner |
|---|---|
| `ai-agent-service` | Build/orchestrate specialized agents (weather, orders, analysis) with Azure Functions + Azure OpenAI function calling. |
| `openai-agents` | Build agents with the OpenAI **Assistants API** behind APIM. |
| `ai-foundry-hosted-agents` | Agents hosted directly by **Microsoft Foundry Agent Service**, governed by APIM. |
| `ai-foundry-hosted-agents-custom-framework` | Foundry-hosted agents built on a custom (non-SDK) agent framework. |
| `ai-foundry-sdk` | Using the Microsoft Foundry SDK against APIM-fronted endpoints. |
| `ai-foundry-toolbox` | Collection of Foundry ↔ APIM integration utilities/patterns. |
| `mcp-a2a-agents` | Multi-agent system combining the **A2A protocol** + MCP servers, orchestrated with **Semantic Kernel/AutoGen** across heterogeneous frameworks. |
| `realtime-mcp-agents` | Realtime (audio/text) agents calling MCP tools (weather, Spotify, ServiceNow integrations). |
| `foundry-iq-agent-svc` | Foundry IQ–powered agent service pattern behind the gateway. |
| `foundry-iq-agentfw` | Foundry IQ agent-framework integration. |

### Security
| Lab folder | One-liner |
|---|---|
| `access-controlling` | OAuth 2.0 / Entra ID / API-key / managed-identity access control for the AI gateway. |
| `content-safety` | **Azure AI Content Safety** moderation of prompts/completions via the `llm-content-safety` policy. |
| `apim-purview-dlp` | **Microsoft Purview** data-loss-prevention integration for AI traffic. |
| `private-connectivity` | Fully private APIM + AI backends via **Private Link**/VNet (internal-mode gateway). |
| `foundry-e2e-private` | End-to-end privately networked Foundry + APIM AI gateway deployment. |
| `mcp-client-authorization`, `mcp-prm-oauth` | *(also listed under MCP)* — OAuth/RFC 9728 security for MCP. |

### Observability
| Lab folder | One-liner |
|---|---|
| `built-in-logging` | Application Insights/Log Analytics logging of prompts, completions, and request metadata. |
| `token-metrics-emitting` | Emit per-consumer token metrics (`llm-emit-token-metric`) to Azure Monitor with custom dimensions. |
| `finops-framework` | Cost tracking, chargeback models, and FinOps dashboards for AI consumption. |

### Resiliency
| Lab folder | One-liner |
|---|---|
| `backend-pool-load-balancing` | Weighted/priority backend **pools** + **circuit breaker** across multiple Foundry endpoints (Bicep). |
| `backend-pool-load-balancing-tf` | Same load-balancing/circuit-breaker pattern expressed in **Terraform**. |
| `token-rate-limiting` | `llm-token-limit` / `azure-openai-token-limit` to cap tokens-per-minute per consumer. |
| `semantic-caching` | Redis-backed semantic cache (`llm-semantic-cache-lookup/store`) to cut latency and cost. |
| `session-awareness` | Session-affinity routing for stateful conversational backends (Assistants API threads). |
| `zero-to-production` | **Progressive composition**: load balancing → token-metrics → rate-limiting → semantic caching, in four cumulative policy stages. |

*(`labs/_deprecated/` holds retired labs superseded by the above and is excluded from the count.)*

### Shared Bicep modules and deployment pattern
Every lab composes the same reusable module library instead of duplicating infrastructure code:

- `modules/apim/v2/apim.bicep` — the APIM service itself (`Microsoft.ApiManagement/service@2024-06-01-preview`), SKU selectable from `Consumption | Developer | Basic | Basicv2 | Standard | Standardv2 | Premium`, system/user-assigned identity, subscriptions, Log Analytics diagnostic settings, and an Application-Insights logger. Also exposes a `releaseChannel` parameter (`Early | Default | Late | GenAI`) — note the **`GenAI` release channel** value, matching the documented "AI Gateway Early release channel" concept.
- `modules/apim/v2/inference-api.bicep` — creates the inference **API** (`/inference/openai`, `/inference/models`, etc. depending on `inferenceAPIType`), wires the supplied `policy.xml`, creates one **backend** per AI service (with optional **circuit breaker**, managed-identity credentials targeting `https://cognitiveservices.azure.com`), and — only when more than one AI service is configured — an additional **`type: 'Pool'`** backend that load-balances across them.
- `modules/cognitive-services/v3/foundry.bicep` (+ `deployments.bicep`) — provisions the **Foundry/Cognitive Services account** (`Microsoft.CognitiveServices/accounts@2025-06-01`, `kind: 'AIServices'`, `allowProjectManagement: true`), a Foundry **project** (`accounts/projects@2025-04-01-preview`), model **deployments** (`accounts/deployments@2025-06-01`), an Application Insights connection, and a `Cognitive Services User` role assignment for APIM's managed identity.
- `modules/operational-insights/v1/workspaces.bicep` + `modules/monitor/v1/appinsights.bicep` — Log Analytics + Application Insights (with `customMetricsOptedInType: 'WithDimensions'` for token metrics).
- `modules/apic/v1/apic.bicep` — optional **API Center** registration used by MCP-registry-style labs.
- Per-lab `src/<service>/mcp-server/mcp.bicep` files define the **MCP server** resource itself (see §6.4).

**Deployment flow:** labs are driven from the Jupyter notebook, which shells out to **Azure CLI** (`az deployment group create` against `main.bicep`) after `uv sync` installs Python deps; a matching `clean-up-resources.ipynb` tears the resource group down. **Prerequisites** stated consistently across lab READMEs: Python 3.12+, VS Code + Jupyter extension, [`uv`](https://docs.astral.sh/uv/) (`uv sync` from repo root), an Azure subscription with **Contributor + RBAC Administrator** (or **Owner**), and Azure CLI signed in. GitHub Codespaces (`codespaces.new/Azure-Samples/AI-Gateway`) is offered as a zero-install alternative.

---

## 4. Pricing

Authoritative **list prices** pulled live from the **Azure Retail Prices API** (`prices.azure.com`, `serviceName eq 'API Management'`), region = **US East**, October 2026 — cross-checked against [azure.microsoft.com/pricing/details/api-management](https://azure.microsoft.com/en-us/pricing/details/api-management/) (whose public page renders pricing tables client-side via JavaScript, so figures below come from the underlying retail-price feed rather than static HTML scraping). **Treat as list price; always verify in the Azure pricing calculator for your subscription/region/EA agreement before budgeting.**

| Tier | Unit price (USD/hr, US East) | Approx. USD/unit/month (×730 hrs) | Included calls | Overage |
|---|---:|---:|---|---|
| **Consumption** | $0 base | $0 | ~1M calls/month free *(tier breakpoint at 100×10K units)* | **$3.50 per million calls** (`$0.035 /10K`) — *[to verify: exact free-tier call count against current portal]* |
| **Developer** | $0.0658 | ≈ $48 | Included in capacity (no per-call meter) | N/A (non-production, no SLA) |
| **Basic** | $0.2016 | ≈ $147 | Included in capacity | N/A |
| **Basic v2** | $0.20548 | ≈ $150 | **10M calls/unit/month** free *(1,000×10K)* | **$3.00 per million calls** (`$0.03/10K`) |
| **Standard** | $0.9407 | ≈ $687 | Included in capacity | N/A |
| **Standard v2** | $0.9589 | ≈ $700 | **50M calls/unit/month** free *(5,000×10K)* | **$2.50 per million calls** (`$0.025/10K`) |
| **Premium** | $3.829 | ≈ $2,795 | Included in capacity (unlimited) | N/A |
| **Premium v2** | $3.83562 | ≈ $2,800 | Unlimited (no call meter found) | N/A |
| **Isolated** (legacy, support-only to provision) | $21.77 | ≈ $15,892 | Included in capacity | N/A |

Additional metered add-ons (US East, retail API):
- **Workspace pack** (per-workspace surcharge, where supported): Standard ≈ $0.137/hr, Standard v2 ≈ $0.137/hr, Premium v2 ≈ $0.137/hr, Isolated ≈ $0.137/hr.
- **Premium (v1) self-hosted gateway**: additional cost per gateway unit/hr (classic Premium only); **Developer tier** self-hosted gateway is **free** but limited to 1 replica.
- **Secondary/availability-zone or secondary-region unit** pricing is lower than primary-unit pricing for v2 tiers (e.g., Standard v2 Secondary Unit ≈ $0.685/hr vs. $0.959/hr primary; Premium v2 Secondary ≈ $1.918/hr vs. $3.836/hr primary) — relevant when using zone redundancy.

**Bottom line for AI Gateway demos:** **Basic v2** is the cheapest SKU that still supports AI-gateway policies, managed identity, backends/pools+circuit breaker, and (per the Oct 2026 workspaces update) even workspaces — at list price ≈ **$150/month** for 1 unit, with 10M calls/month included. **Standard v2** (≈$700/mo) adds VNet-integration for isolated backends; **Premium v2** (≈$2,800/mo) adds full VNet injection, availability zones, and the highest scale ceiling (30 units).

Sources: [Azure Retail Prices API](https://prices.azure.com/api/retail/prices?$filter=serviceName%20eq%20%27API%20Management%27) (live query), [azure.microsoft.com/pricing/details/api-management](https://azure.microsoft.com/en-us/pricing/details/api-management/).

---

## 5. Limits

From [Azure subscription and service limits — API Management section](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/azure-subscription-service-limits#azure-api-management-limits) (revised **March 2026**; existing over-limit services keep prior capacity) and [v2-service-tiers-overview](https://learn.microsoft.com/en-us/azure/api-management/v2-service-tiers-overview):

### Entity limits — classic & v2 tiers (per service instance)
| Entity | Consumption | Developer | Basic/Basic v2 | Standard/Standard v2 | Premium/Premium v2 |
|---|---:|---:|---:|---:|---:|
| API operations | 3,000 | 3,000 | 10,000 | 50,000 | 75,000 |
| API tags | 1,500 | 1,500 | 1,500 | 2,500 | 15,000 |
| Named values | 5,000 | 5,000 | 5,000 | 10,000 | 18,000 |
| Loggers | 100 | 100 | 100 | 200 | 400 |
| Products | 100 | 100 | 200 | 500 | 2,000 |
| Subscriptions | N/A | 10,000 | 15,000 | 25,000 | 75,000 |
| Users | N/A | 20,000 | 20,000 | 50,000 | 75,000 |
| User-assigned managed identities | 10 | 10 | 10 | 10 | 10 |
| Workspaces per workspace gateway | N/A | N/A | 30¹ | 30¹ | 30 |
| Self-hosted gateways | N/A | 5 | N/A | N/A | 100² |

¹ v2 tiers only. ² Premium tier only.

### Scale units & other tier facts (from feature comparison table)
| Feature | Consumption | Developer | Basic | Basic v2 | Standard | Standard v2 | Premium | Premium v2 |
|---|---|---|---|---|---|---|---|---|
| Max scale units | automatic | 1 | 2 | **10** | 4 | **10** | 12/region | **30** |
| Built-in cache | — | 10 MB | 50 MB | 250 MB | 1 GB | 1 GB | 5 GB | 5 GB |
| Multi-region deployment | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✔️ | ❌ |
| Availability zones | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✔️ | ✔️ |
| Workspaces | ❌ | ❌ | ❌ | **✔️ (new)** | ❌ | ✔️ | ✔️ | ✔️ |
| Self-hosted gateway | ❌ | ✔️ (1 replica, free) | ❌ | ❌ | ❌ | ❌ | ✔️ (paid, unlimited replicas) | ❌ |
| VNet injection (full isolation) | ❌ | ✔️ | ❌ | ❌ | ❌ | ❌ | ✔️ | ✔️ |
| VNet integration (outbound to isolated backends) | ❌ | ✔️ | ❌ | ❌ | ❌ | ✔️ | ✔️ | ✔️ |

### Workspace limits (Premium workspace, representative of v2-tier workspace ceilings too)
APIs (incl. versions/revisions) 200 · API operations 5,000 · Backends 200 · Products 100 · Subscriptions 5,000 · Scale units per premium workspace gateway 12 · Workspaces per instance 100.

### Developer portal limits — v2 tiers
Media files 15 (≤500 KB each) · Pages: 30 (Basic v2) / 50 (Standard v2, Premium v2) · Widgets: 30/50/50 · Client requests/minute: 200 (all v2 tiers). Custom HTML/custom widgets **not supported** in v2 tiers.

### Gateway runtime limits
| Runtime limit | Classic | V2 | Consumption |
|---|---|---|---|
| Concurrent back-end connections/HTTP authority | 2,048/unit (1,024 in Developer) | 2,048 | Unlimited |
| Policy document size | **512 KiB** | **512 KiB** | 16 KiB |
| Request payload size | Unlimited | **1 GiB** | 1 GiB |
| Buffered payload size | 500 MiB | 2 MiB | 2 MiB |
| Request URL size | Unlimited | 16,384 bytes | 16,384 bytes |
| Total request duration | Unlimited | Unlimited | **30 seconds** |
| Active WebSocket connections/unit | 5,000 | 5,000 | N/A |

### AI-gateway/MCP feature-to-tier matrix
- **`llm-token-limit`, `llm-emit-token-metric`, `authentication-managed-identity`, backends/pools/circuit-breaker, `llm-content-safety`**: **all tiers** including Consumption (per each policy's "Gateways" usage note), **except** circuit breaker, which is **not available on Consumption**.
- **MCP servers** (expose-REST-as-MCP or passthrough): **Developer | Basic | Basic v2 | Standard | Standard v2 | Premium | Premium v2** — **not Consumption**, and **not inside workspaces**.
- **Workspaces**: **Basic v2, Standard v2, Premium, Premium v2** (Developer/Basic/Standard classic and Consumption excluded).
- **Anthropic Messages API / unified model API**: currently **v2 tiers only** (preview).
- **Self-hosted gateway**: **Developer** (free, 1 replica) and **Premium classic** (paid, unlimited replicas) only — **not available in any v2 tier**.

Source: [azure-subscription-service-limits#api-management-limits](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/azure-subscription-service-limits#azure-api-management-limits), [api-management-features](https://learn.microsoft.com/en-us/azure/api-management/api-management-features), [v2-service-tiers-overview](https://learn.microsoft.com/en-us/azure/api-management/v2-service-tiers-overview), [mcp-server-overview](https://learn.microsoft.com/en-us/azure/api-management/mcp-server-overview).

---

## 6. Benefits / business value of an AI gateway

- **Governance** — centralize policy enforcement (auth, content safety, schema validation) across every AI app/agent/team instead of re-implementing it per application; register APIs, MCP servers, and agents in **API Center** for org-wide discoverability and Copilot Studio export.
- **Cost control / FinOps** — `llm-token-limit`/quota policies stop one app from exhausting a shared TPM/PTU allocation; semantic caching cuts redundant model calls; token-metric emission + chargeback dashboards (see `finops-framework` lab) attribute AI spend per team/department/subscription.
- **Resiliency** — backend pools + circuit breakers let you mix pay-as-you-go and **Provisioned Throughput Unit (PTU)** Foundry deployments with priority routing, and gracefully fail over on 429/5xx without hand-rolled retry logic in every client.
- **Security** — managed-identity auth removes API keys from app code and backend sprawl; OAuth via credential manager secures both MCP clients and MCP backends; content-safety and DLP policies apply uniformly to prompts, completions, MCP tool I/O, and A2A agent traffic.
- **Observability** — built-in Azure Monitor dashboards, Application Insights prompt/completion logging, and per-consumer token metrics give platform teams the telemetry needed to right-size quotas, debug agent behavior, and prove compliance.
- **Developer self-service** — the AI-Gateway Dev Portal, API Management developer portal, and API Center portal let application teams discover and self-subscribe to governed models/MCP tools without filing tickets against the platform team, while platform teams retain centralized control via workspaces.

---

## 7. Demo technical recommendations

### 7.1 Tier choice
For a demo that needs **Azure OpenAI/Foundry backend + `llm-token-limit` + `llm-emit-token-metric` + backend-pool load balancing + MCP server from a REST API**, the cheapest *and* fastest-to-deploy SKU that supports **every** one of those features is:

> **Basic v2** (`Basicv2`) — ≈ $150/month list price, supports MCP servers, backends/pools/circuit-breaker, all `llm-*` policies, managed identity, and (as of the Oct 2026 docs refresh) **workspaces** too. It is **not** available for: self-hosted gateway, multi-region, VNet injection, or Anthropic/unified-model-API-specific scenarios requiring VNet isolation — none of which this demo needs.

**Deployment time:** v2 tiers are purpose-built to **deploy in minutes** (the v2 platform is a newer, more scalable control plane) versus classic tiers' typical **~30–45 minute** provisioning time (and the ~45 min+ needed for any subsequent scale/SKU change). This is explicitly called out as a v2-tier "key capability": *"Deploy a production-ready API Management instance in minutes... Scale a Basic v2 or Standard v2 instance quickly to up to 10 units."* If sub-5-minute iteration matters more than production features, **Consumption** is faster still (serverless, no provisioning wait) but **does not support MCP servers or circuit breakers**, so it fails this demo's requirements. **Developer** tier is a common lab fallback supporting everything needed except production SLA; it provisions on the **classic (slower)** platform.

### 7.2 Azure OpenAI / Foundry model availability (GlobalStandard)
> **2026-10-06 demo update:** This repository's live demo was updated to `gpt-6.1-sol` version `2026-09-29` on current Foundry resources and projects (`proj-apimaigw-swc`, `proj-apimaigw-frc`) with GlobalStandard 100K TPM per region. APIM now targets `https://<account>.services.ai.azure.com/openai` for OpenAI v1 Chat Completions and Responses API traffic; content safety still uses the account's Cognitive Services endpoint.

As of the Oct 2026 Foundry Models catalog ([models-sold-directly-by-azure](https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/models-sold-directly-by-azure)), the GPT lineage has grown well past GPT-4: current/newest series include **GPT‑6.1, GPT‑6, GPT‑5.6, GPT‑5.5, GPT‑5.4, GPT‑5.3‑codex, GPT‑5.2, GPT‑5.1, GPT‑5** — but the **GPT‑4.1 series (`gpt-4.1`, `gpt-4.1-mini`, `gpt-4.1-nano`)** and **GPT‑4o / GPT‑4o‑mini** remain listed, non-deprecated, GA models, widely used in demos for their low cost/latency. The AI-Gateway repo's own worked example (`multi-model-failover` Copilot prompt in the repo README) explicitly uses **`gpt-4.1-mini`** as primary and **`gpt-4.1-nano`** as fallback, deployed to **Sweden Central**.
- **Region availability is model- and deployment-type-specific** (GlobalStandard vs. DataZone vs. regional Standard vs. PTU) and changes frequently — Microsoft does not publish one static matrix; always check the live **[Region availability for Foundry Models sold by Azure](https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/models-sold-directly-by-azure-region-availability)** page before deployment. *(To verify at demo time: exact current GlobalStandard GA status of `gpt-4.1-mini`/`gpt-4o-mini` in Sweden Central, East US 2, and France Central specifically — these three regions are commonly cited as early/broad-availability GlobalStandard regions for recent GPT model families in Microsoft blog posts and the model catalog, but should be reconfirmed against the live region picker in the Foundry/Azure portal.)*
- **Recommendation for a resilient, cheap demo:** deploy **`gpt-4.1-mini`** (or `gpt-4o-mini`) as GlobalStandard in **two regions** (e.g., **Sweden Central** + **East US 2**) to populate a genuine backend pool for the load-balancing/circuit-breaker scenario.

### 7.3 Recommended Bicep resource types & API versions
Matches what the **AI-Gateway repo's shared modules** use in production labs (verified by direct inspection, Oct 2026):

| Resource | Type | apiVersion used in AI-Gateway repo | Notes |
|---|---|---|---|
| APIM service | `Microsoft.ApiManagement/service` | `2024-06-01-preview` | v2-tiers doc states **GA baseline is `2024-05-01`** for v2-tier capability; repo uses a slightly newer preview for extra properties (e.g., `releaseChannel`). |
| APIM API (incl. MCP server) | `Microsoft.ApiManagement/service/apis` | `2024-06-01-preview` | For **MCP server CRUD via REST/CI-CD with tool sub-resources**, Microsoft Learn explicitly recommends pinning **`2025-09-01-preview`** or later (introduces the dedicated `api-tool` sub-resource so tools can be added/renamed/removed without recreating the server). |
| APIM backend (incl. pool + circuit breaker) | `Microsoft.ApiManagement/service/backends` | `2024-06-01-preview` (docs sample shows `2023-09-01-preview`) | Either preview version supports `circuitBreaker` and `type: 'Pool'`; use the newest preview your tooling accepts. |
| APIM API policy | `Microsoft.ApiManagement/service/apis/policies` | `2024-06-01-preview` | — |
| APIM diagnostics | `Microsoft.ApiManagement/service/apis/diagnostics` | `2024-06-01-preview` (LLM logging) / `2022-08-01` (App Insights) | `largeLanguageModel` diagnostics block enables prompt/completion logging. |
| Cognitive Services / Foundry account | `Microsoft.CognitiveServices/accounts` | `2025-06-01`, `kind: 'AIServices'` | Set `allowProjectManagement: true` to enable Foundry project creation on the same account. |
| Foundry project | `Microsoft.CognitiveServices/accounts/projects` | `2025-04-01-preview` | — |
| Model deployment | `Microsoft.CognitiveServices/accounts/deployments` | `2025-06-01` | `sku.name` (e.g., `GlobalStandard`) + `sku.capacity` (TPM/1000 units) govern throughput and billing. |
| API Center service/API/MCP registration | `Microsoft.ApiCenter/services*` | `2024-06-01-preview` | Used by the MCP-registry labs. |

### 7.4 Exact policy XML syntax (verified against Microsoft Learn + AI-Gateway repo)

**`llm-token-limit`** (model-agnostic; works for OpenAI Chat Completions/Responses, Anthropic Messages, Vertex AI):
```xml
<llm-token-limit counter-key="@(context.Subscription.Id)"
    tokens-per-minute="500" estimate-prompt-tokens="false"
    remaining-tokens-variable-name="remainingTokens">
</llm-token-limit>
```
Legacy Azure-OpenAI-specific equivalent (still used by several labs): `azure-openai-token-limit` with identical attributes.

**`llm-emit-token-metric`**:
```xml
<llm-emit-token-metric namespace="llm-metrics">
    <dimension name="Client IP" value="@(context.Request.IpAddress)" />
    <dimension name="API ID" value="@(context.Api.Id)" />
    <dimension name="User ID" value="@(context.Request.Headers.GetValueOrDefault('x-user-id','N/A'))" />
</llm-emit-token-metric>
```

**`authentication-managed-identity`** (to call Azure OpenAI/Foundry as the backend):
```xml
<authentication-managed-identity resource="https://cognitiveservices.azure.com"
    output-token-variable-name="managed-id-access-token" ignore-error="false" />
<set-header name="Authorization" exists-action="override">
    <value>@("Bearer " + (string)context.Variables["managed-id-access-token"])</value>
</set-header>
```

**`set-backend-service`** pointing at a load-balanced backend **pool** id, with retry-on-429/503 (exact pattern from the `backend-pool-load-balancing` lab):
```xml
<inbound>
    <base />
    <set-backend-service backend-id="inference-backend-pool" />
</inbound>
<backend>
    <retry count="2" interval="0" first-fast-retry="true"
           condition="@(context.Response.StatusCode == 429 || context.Response.StatusCode == 503)">
        <set-backend-service backend-id="inference-backend-pool" />
        <forward-request buffer-request-body="true" />
    </retry>
</backend>
```

**Backend pool with circuit breaker** — Bicep (`Microsoft.ApiManagement/service/backends`, `type: 'Pool'` referencing individual backends that each carry their own `circuitBreaker` rule):
```bicep
resource inferenceBackend 'Microsoft.ApiManagement/service/backends@2024-06-01-preview' = [for (config, i) in aiServicesConfig: {
  name: config.name
  parent: apimService
  properties: {
    description: 'Inference backend'
    url: '${config.endpoint}openai'
    protocol: 'http'
    circuitBreaker: {
      rules: [
        {
          name: 'InferenceBreakerRule'
          failureCondition: {
            count: 1
            errorReasons: [ 'Server errors' ]
            interval: 'PT1M'
            statusCodeRanges: [ { min: 429, max: 429 } ]
          }
          tripDuration: 'PT1M'
          acceptRetryAfter: true
        }
      ]
    }
    credentials: { managedIdentity: { resource: 'https://cognitiveservices.azure.com' } }
  }
}]

resource backendPool 'Microsoft.ApiManagement/service/backends@2024-06-01-preview' = if (length(aiServicesConfig) > 1) {
  name: 'inference-backend-pool'
  parent: apimService
  properties: {
    description: 'Load balancer for multiple inference endpoints'
    type: 'Pool'
    pool: {
      services: [for (config, i) in aiServicesConfig: {
        id: '/backends/${inferenceBackend[i].name}'
        priority: config.?priority
        weight: config.?weight
      }]
    }
  }
}
```
(Microsoft Learn's own circuit-breaker example for a single, non-pooled backend uses equivalent syntax with a `5xx` range and a 3-failure/1-hour rule — see `backends` doc §"Circuit breaker".)

### 7.5 MCP server from an existing REST API — exact shape used by the repo
MCP servers are **not** a distinct ARM resource type; they are an **API** resource with `type: 'mcp'` plus an **`mcpTools`** array referencing existing API **operations**. This is precisely what `labs/mcp-from-api/src/weather/mcp-server/mcp.bicep` does:
```bicep
resource mcp 'Microsoft.ApiManagement/service/apis@2024-06-01-preview' = {
  parent: apim
  name: 'weather-mcp'
  properties: {
    type: 'mcp'
    displayName: 'Weather MCP'
    description: 'MCP for weather data'
    subscriptionRequired: false
    path: 'weather-mcp'
    protocols: [ 'https' ]
    mcpTools: [
      {
        name: operation.name            // existing 'get-weather' operation
        operationId: operation.id
        description: operation.properties.description
      }
    ]
  }
}

resource policy 'Microsoft.ApiManagement/service/apis/policies@2021-12-01-preview' = {
  parent: mcp
  name: 'policy'
  properties: { value: loadTextContent('policy.xml'), format: 'rawxml' }
}
```
The resulting MCP endpoint is `${apim.properties.gatewayUrl}/weather-mcp/mcp` (Streamable HTTP transport). The lab's `policy.xml` layers `authentication-managed-identity` (to call the Azure OpenAI/Foundry backend the tool wraps) + `set-backend-service` + `azure-openai-emit-token-metric` on top of the MCP tool call — i.e., **all AI-gateway policies apply transparently to MCP tool invocations**, exactly as the product docs describe.

**Important versioning nuance:** the repo's hand-rolled Bicep pins `2024-06-01-preview` for the `apis` resource with `type: 'mcp'` and `mcpTools`. Microsoft's dedicated **["Manage MCP servers programmatically"](https://learn.microsoft.com/en-us/azure/api-management/manage-mcp-servers-rest-api)** guidance (updated 2026‑06‑23) instead recommends **`2025-09-01-preview`**, which introduces the standalone **API Tool** sub-resource (`Microsoft.ApiManagement/service/apis/tools`) so CI/CD pipelines can add/rename/remove individual tools **without re-issuing the whole MCP-server `apis` PUT** — a materially better pattern for a production (non-lab) deployment pipeline than embedding the full `mcpTools` array inline.

---

## 8. Sources

- apimlove hub — https://azure.github.io/api-management-resources/
- AI-Gateway repo (README, labs/*, modules/*) — https://github.com/Azure-Samples/AI-Gateway
- AI gateway capabilities — https://learn.microsoft.com/en-us/azure/api-management/genai-gateway-capabilities
- MCP server overview — https://learn.microsoft.com/en-us/azure/api-management/mcp-server-overview
- Expose REST API as MCP server — https://learn.microsoft.com/en-us/azure/api-management/export-rest-mcp-server
- Manage MCP servers programmatically — https://learn.microsoft.com/en-us/azure/api-management/manage-mcp-servers-rest-api
- Import an A2A agent API — https://learn.microsoft.com/en-us/azure/api-management/agent-to-agent-api
- Unified model API (preview) — https://learn.microsoft.com/en-us/azure/api-management/unified-model-api
- `llm-token-limit` policy — https://learn.microsoft.com/en-us/azure/api-management/llm-token-limit-policy
- `llm-emit-token-metric` policy — https://learn.microsoft.com/en-us/azure/api-management/llm-emit-token-metric-policy
- `llm-content-safety` policy — https://learn.microsoft.com/en-us/azure/api-management/llm-content-safety-policy
- `authentication-managed-identity` policy — https://learn.microsoft.com/en-us/azure/api-management/authentication-managed-identity-policy
- Backends (pools, circuit breaker) — https://learn.microsoft.com/en-us/azure/api-management/backends
- v2 service tiers overview — https://learn.microsoft.com/en-us/azure/api-management/v2-service-tiers-overview
- Workspaces overview — https://learn.microsoft.com/en-us/azure/api-management/workspaces-overview
- Feature comparison of APIM tiers — https://learn.microsoft.com/en-us/azure/api-management/api-management-features
- Azure subscription/service limits (APIM section) — https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/azure-subscription-service-limits#azure-api-management-limits
- API Management pricing page — https://azure.microsoft.com/en-us/pricing/details/api-management/
- Azure Retail Prices API (live data source for §4) — https://prices.azure.com/api/retail/prices?$filter=serviceName%20eq%20%27API%20Management%27
- Foundry Models sold by Azure — https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/models-sold-directly-by-azure
- Region availability for Foundry Models — https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/models-sold-directly-by-azure-region-availability
- Premium v2 GA announcement (TechCommunity) — https://techcommunity.microsoft.com/blog/integrationsonazureblog/announcing-the-general-availability-ga-of-the-premium-v2-tier-of-azure-api-manag/4471499

---

### Notes on confidence / items to verify before using in a customer-facing deck
- **Pricing** reflects **US East** list prices from the live Retail Prices API on the compile date; Azure updates prices periodically and other regions differ — re-query before quoting externally.
- **Consumption tier free-call threshold** (stated here as ~1M calls/month) is derived from the retail meter's tier breakpoint (100 × 10K units) and should be cross-checked against the current public pricing page, since Microsoft has changed Consumption free-tier terms historically.
- **GlobalStandard regional availability** for `gpt-4.1-mini`/`gpt-4o-mini` in Sweden Central/East US 2/France Central specifically should be reconfirmed in the live Foundry region picker — the cited region-availability doc is the correct source but changes frequently and was not fully enumerated here.
- The **apimlove** site (`azure.github.io/api-management-resources`) returned mostly a landing-page summary at fetch time rather than a dated "what's new" changelog; treat §1's "What's new" as sourced primarily from Microsoft Learn `ms.date`/`updated_at` metadata and the AI-Gateway repo, not from apimlove directly.
