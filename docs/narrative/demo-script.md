# Live demo script — 25 minutes

**Demo story:** Zava Retail puts model, MCP, and agent traffic behind Azure API Management to fix key sprawl, cost surprise, safety gaps, 429 outages, and missing observability.  
**Demo folder:** `demo`  
**Install once from the demo folder:** `pip install -r requirements.txt`  
**Configuration:** The demo client auto-resolves configuration through Azure CLI from resource group `rg-apimaigw-demo-swc`.  
**Command pattern:** `python -m ai_gateway <scenario>`

> Presenter note: Run commands from the `demo` folder. Keep Azure portal open in a second window.

## Pre-flight checklist

### T-24h

- Confirm the resource group exists: `rg-apimaigw-demo-swc`.
- Confirm APIM Basic v2 exists in Sweden Central: `apim-apimaigw-demo-<suffix>`.
- Confirm two Microsoft Foundry AI Services accounts exist in Sweden Central and France Central.
- Confirm each Foundry account has `gpt-5.4-nano` GlobalStandard with 50K TPM.
- Confirm local key auth is disabled on the Foundry accounts.
- Confirm APIM system-assigned managed identity has `Cognitive Services OpenAI User` on both Foundry accounts.
- Confirm APIM backend pool `foundry-pool` has both backends, weighted 50/50.
- Confirm Gold and Bronze products exist with product-scope token policies.
- Confirm Application Insights has custom metrics namespace `ai-gateway`.
- Confirm Log Analytics receives `ApiManagementGatewayLlmLog`.
- Run the full demo once:

```powershell
cd demo
pip install -r requirements.txt
python -m ai_gateway all
```

### T-1h

- Sign in to Azure CLI with the presenter account.
- Verify the active subscription is the demo subscription.
- Re-run key scenarios:

```powershell
cd demo
python -m ai_gateway chat
python -m ai_gateway load-balance
python -m ai_gateway token-limit
python -m ai_gateway content-safety
python -m ai_gateway mcp
python -m ai_gateway metrics
```

- Open Azure portal tabs:
  - APIM > APIs > Inference API > policy.
  - APIM > Backends > `foundry-pool`.
  - APIM > Products > Gold and Bronze policies.
  - APIM > MCP servers blade.
  - Application Insights > Metrics, namespace `ai-gateway`.
  - Log Analytics query editor.

### T-5min

- Increase terminal font.
- Clear terminal scrollback.
- Confirm the demo folder is active.
- Confirm Bronze token bucket has refilled. If not, wait 60 seconds.
- Keep fallback screenshots or saved output available.

## Reset procedure

- For Bronze TPM throttling, wait **60 seconds** for the Bronze tokens-per-minute budget to refill.
- If monthly quota behavior was triggered during rehearsal, use Gold for the live flow or redeploy/reset the demo product state using the repository deployment workflow.
- If metrics are slow, explain that Application Insights and Log Analytics can have ingestion delay and show the pre-opened query/results tab.

---

## D1 — Keyless chat through the gateway

**Time:** 3 minutes  
**Goal:** Show an app calling APIM while APIM calls Foundry with managed identity.

**Setup:**

- APIM inference API path: `/inference/openai/v1`.
- App uses an APIM subscription key only.
- Foundry local key auth is disabled.

**Command:**

```powershell
cd demo
python -m ai_gateway chat
```

**What to show in Azure portal:**

- APIM > APIs > Inference API > Inbound policy.
- Highlight managed identity policy and backend routing to the inference backend or pool.
- Show Backends > `foundry-pool` if needed.

**Talk track:**

"This is the simplest app experience. The client is not holding a Foundry key. It calls APIM with a subscription key, and APIM uses its managed identity to call the Foundry deployment. That removes backend keys from app code and gives the platform team a policy enforcement point."

**Expected output:**

- A normal chat completion response.
- Response headers showing backend, region, and token consumption, such as remaining tokens and tokens consumed.
- Evidence that the request went through the gateway endpoint.

**If it fails:**

- If Azure CLI config resolution fails, run `az account show` and confirm the active subscription.
- If auth fails, show the portal role assignment: APIM managed identity has `Cognitive Services OpenAI User` on both Foundry accounts.
- Fallback: show the saved D1 output and continue to D2.

---

## D2 — Load balancing and failover

**Time:** 3 minutes  
**Goal:** Show six requests spread across Sweden Central and France Central through the backend pool.

**Command:**

```powershell
cd demo
python -m ai_gateway load-balance
```

**What to show in Azure portal:**

- APIM > Backends > `foundry-pool`.
- Show the two backends for Sweden Central and France Central.
- Show 50/50 weighting and per-backend circuit breaker policy.

**Talk track:**

"Zava's Black Friday outage came from treating one deployment as if it were infinitely available. Here APIM has a backend pool with two Foundry regions. Weighted routing spreads traffic, retry can try the pool again, and the circuit breaker can trip on 429 or 5xx while honoring `Retry-After`."

**Expected output:**

- Six successful requests.
- Backend or region values alternate or distribute across Sweden Central and France Central.
- Token headers appear for each request.

**If it fails:**

- If all traffic goes to one backend, explain that weighted routing is probabilistic over small samples and run once more.
- If one backend fails, show how circuit breaker and retry are intended to protect the app, then continue with the healthy backend.
- Fallback: show Backends > `foundry-pool` configuration and saved six-request output.

---

## D3 — Token budgets per team

**Time:** 4 minutes  
**Goal:** Show Bronze being throttled while Gold remains available.

**Setup:**

- Gold product: `Gold – Customer Support Copilot`, 20,000 tokens/min, 5M tokens/month.
- Bronze product: `Bronze – Marketing Sandbox`, 300 tokens/min, 100K tokens/month.
- Headers returned: `x-ratelimit-remaining-tokens`, `x-quota-remaining-tokens`, `x-tokens-consumed`.

**Command:**

```powershell
cd demo
python -m ai_gateway token-limit
```

**What to show in Azure portal:**

- APIM > Products > `Gold – Customer Support Copilot` > policies.
- APIM > Products > `Bronze – Marketing Sandbox` > policies.
- Highlight `llm-token-limit` and different policy values.

**Talk track:**

"Products become team or workload tiers. Gold is customer support and must survive Black Friday. Bronze is a sandbox and should have a strict budget. The gateway enforces that distinction before the backend becomes the bottleneck. Bronze can receive 429 Too Many Requests with `Retry-After`, while Gold continues. Monthly quota exhaustion returns 403."

**Expected output:**

- Bronze succeeds for early calls, then receives `429 Too Many Requests` with `Retry-After`.
- Gold request succeeds after Bronze is throttled.
- Headers show remaining and consumed tokens.

**If it fails:**

- If Bronze does not throttle, the token bucket may not be exhausted yet. Run the scenario again or use a larger prompt if the script provides one.
- If Bronze remains throttled from rehearsal, wait **60 seconds** and rerun.
- If monthly quota was exhausted, use Gold for the rest of the demo or show saved Bronze output.

---

## D4 — Content safety

**Time:** 3 minutes  
**Goal:** Show a benign prompt passing and a jailbreak blocked by Prompt Shields before reaching the model.

**Command:**

```powershell
cd demo
python -m ai_gateway content-safety
```

**What to show in Azure portal:**

- APIM > APIs > Inference API > policy.
- Highlight `llm-content-safety`.
- Mention Prompt Shields and harm categories: Hate, SelfHarm, Sexual, Violence with threshold 4 and 8 severity levels.

**Talk track:**

"Zava's jailbreak incident happened because safety was implemented app by app. The gateway approach gives Zava one safety layer. A normal retail prompt passes. A prompt like 'ignore all previous instructions' with DAN-style jailbreak language is blocked by Prompt Shields before it reaches the model."

**Expected output:**

- Benign prompt returns a normal response.
- Jailbreak prompt is blocked with a clear policy or safety response.
- The script indicates the blocked request did not reach the model.

**If it fails:**

- If the jailbreak is not blocked, do not improvise more unsafe content. Show the policy in the portal and the saved expected output.
- If Content Safety endpoint auth fails, point back to managed identity and role assignment, then continue.

---

## D5 — MCP server from an existing REST API

**Time:** 4 minutes  
**Goal:** Show Zava REST operations exposed as MCP tools through APIM.

**Setup:**

- REST API: `/zava`.
- Operations: `search-products`, `get-order-status`.
- MCP endpoint: `/zava-mcp/mcp`.
- MCP server has a rate-limit-by-key policy.

**Command:**

```powershell
cd demo
python -m ai_gateway mcp
```

**What to show in Azure portal:**

- APIM > MCP servers blade.
- Open Zava MCP server.
- Show tools: `search-products`, `get-order-status`.
- Show policy applies to the MCP server.

**Talk track:**

"Zava already had REST APIs for product search and order status. APIM can expose REST operations as MCP tools, so agents can discover and call them through a governed endpoint. The important point is not just tool exposure. It is that auth, rate limits, quotas, and logging are enforced at the MCP gateway."

**Expected output:**

- MCP initialize succeeds.
- `tools/list` returns `search-products` and `get-order-status`.
- `tools/call search-products` returns outdoor products.
- `tools/call get-order-status` returns status for an order such as `ORD-1042`.

**If it fails:**

- If MCP initialize fails, verify the MCP endpoint path `/zava-mcp/mcp` in the portal.
- If a tool call fails, show the REST API operation behind the tool and explain the REST-to-MCP mapping.
- Fallback: show saved `tools/list` and tool call outputs.

---

## D6 — Agent using model and MCP tools through the gateway

**Time:** 4 minutes  
**Goal:** Show an agent-style flow where the model decides to call MCP tools, and both model and tool traffic pass through APIM.

**Prompt:**

"Which outdoor products do you have under 100 EUR, and where is my order ORD-1042?"

**Command:**

```powershell
cd demo
python -m ai_gateway agent
```

**What to show in Azure portal:**

- APIM > APIs > Inference API policy.
- APIM > MCP servers blade > Zava MCP server.
- Application Insights metrics if live metrics appear.

**Talk track:**

"This is the end-state pattern. The app asks a business question. The model call goes through the inference gateway. The tool calls go through the MCP gateway. Zava can govern both parts of the agent loop instead of letting tools bypass policy."

**Expected output:**

- The model identifies the need to search products and check order status.
- MCP tool calls are shown.
- Final answer combines outdoor products under 100 EUR and order `ORD-1042` status.

**If it fails:**

- If the model does not choose the tool path, explain that tool choice can vary and run again.
- If MCP works from D5 but agent orchestration fails, show D5 results and explain that the gateway path is validated for the tool calls.
- Fallback: use saved agent transcript.

---

## D7 — Observability: token metrics and LLM logs

**Time:** 3 minutes  
**Goal:** Show token usage per product and LLM log aggregation by deployment.

**Command:**

```powershell
cd demo
python -m ai_gateway metrics
```

**What to show in Azure portal:**

- Application Insights > Metrics.
- Namespace: `ai-gateway`.
- Metrics for prompt, completion, and total tokens.
- Log Analytics query editor.
- Built-in workbook if available.

**KQL — token metrics per product:**

```kusto
AppMetrics
| where TimeGenerated > ago(1d) and Name in ('Prompt Tokens','Completion Tokens','Total Tokens')
| extend Product = tostring(Properties['Product'])
| summarize Tokens = sum(Sum) by Product, Name
```

**KQL — LLM logs by deployment:**

```kusto
ApiManagementGatewayLlmLog
| where TimeGenerated > ago(1d)
| summarize Requests=count(), PromptTokens=sum(PromptTokens), CompletionTokens=sum(CompletionTokens) by DeploymentName
```

**Talk track:**

"This is where platform and FinOps teams get leverage. We can break token usage down by product, so Gold and Bronze are visible separately. We can also summarize LLM logs by deployment name to understand backend usage. This is the evidence layer for chargeback, right-sizing, and incident response."

**Expected output:**

- AppMetrics query returns token totals by Product and Name.
- LLM log query returns request count, prompt tokens, and completion tokens by DeploymentName.
- Demo script prints or links to recent metric evidence.

**If it fails:**

- Metrics and logs can have ingestion delay. Show pre-opened results from the rehearsal.
- If `AppMetrics` is empty, verify the `ai-gateway` namespace and custom dimensions in the portal.
- If `ApiManagementGatewayLlmLog` is empty, show APIM diagnostic settings and explain ingestion delay.

---

## D8 — Bonus: CI/CD

**Time:** 1 minute  
**Goal:** Show that the environment is reproducible through Bicep and GitHub Actions.

**Command:**

```powershell
cd demo
python -m ai_gateway all
```

> For the 1-minute close, do not run the full command unless there is extra time. Show the command and the workflow instead.

**What to show in Azure portal / repo:**

- Repository `infra/` Bicep files.
- `.github/workflows/deploy.yml`.
- Workflow steps: deploy, smoke test, run demo.

**Talk track:**

"The final point is operational. This should not be a click-built demo. The APIM service, Foundry backends, policies, products, MCP server, diagnostics, and smoke tests are deployed through Bicep and GitHub Actions. That is how Zava moves from a good demo to a governed platform."

**Expected output:**

- If run, the `all` scenario executes D1 through D7.
- If not run, the audience sees the reproducible deployment path.

**If it fails:**

- Treat CI/CD as a proof point, not a dependency for the live demo.
- Show the workflow file and a prior successful run if available.

## Presenter timing guide

| Scenario | Time | Must show |
|---|---:|---|
| D1 Chat | 3 min | Managed identity/keyless pattern and headers. |
| D2 Load balance | 3 min | `foundry-pool` and two regions. |
| D3 Token limit | 4 min | Bronze 429, Gold success. |
| D4 Safety | 3 min | Benign OK, jailbreak blocked. |
| D5 MCP | 4 min | `tools/list`, `tools/call`. |
| D6 Agent | 4 min | Model + MCP tools through gateway. |
| D7 Metrics | 3 min | KQL results. |
| D8 CI/CD | 1 min | Bicep + GitHub Actions. |
