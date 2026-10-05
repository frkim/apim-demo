# Azure API Management AI Gateway FAQ

**Date context:** October 2026  
**Pricing note:** Prices are **list price, US East, October 2026**. Verify in the Azure pricing calculator for your subscription, region, and agreement.

## Questions and answers

| # | Question | Crisp answer | Source |
|---:|---|---|---|
| 1 | What is an AI gateway? | An AI gateway is a central policy point for AI traffic: model APIs, MCP servers, and A2A agent APIs. APIM applies authentication, token limits, content safety, routing, logging, and observability before traffic reaches the backend. | https://learn.microsoft.com/en-us/azure/api-management/genai-gateway-capabilities |
| 2 | Why use APIM instead of calling Foundry or Azure OpenAI directly? | Direct calls are simplest for one app. APIM becomes valuable when many apps need common controls: managed identity, product-specific token budgets, backend failover, content safety, and token metrics. | https://learn.microsoft.com/en-us/azure/api-management/genai-gateway-capabilities |
| 3 | What does the Zava demo prove? | It proves an app can call an OpenAI-compatible APIM endpoint while APIM handles managed identity to Foundry, load balancing, token budgets, content safety, MCP tools, agent flow, and metrics. | https://learn.microsoft.com/en-us/azure/api-management/genai-gateway-capabilities |
| 4 | Which APIM tier should we use for this demo? | Basic v2 is the recommended demo tier: about $150/month list price, 10M calls/unit included, and support for MCP servers, AI policies, managed identity, backends/pools, and circuit breaker. | https://learn.microsoft.com/en-us/azure/api-management/v2-service-tiers-overview |
| 5 | Why not Consumption tier? | Consumption has a $0 base price and call-based billing, but it does not support MCP servers or circuit breaker and has a smaller policy document limit. The Zava demo needs MCP and circuit breaker. | https://learn.microsoft.com/en-us/azure/api-management/mcp-server-overview and https://learn.microsoft.com/en-us/azure/api-management/backends |
| 6 | Does APIM add token cost? | No. Model tokens are billed separately by Foundry or the model provider. APIM pricing covers gateway capacity/calls and add-ons; token policies help control and observe model spend. | https://azure.microsoft.com/en-us/pricing/details/api-management/ |
| 7 | What are the headline prices? | US East list price, Oct 2026: Developer about $48/month, Basic v2 about $150/month, Standard v2 about $700/month, Premium v2 about $2,800/unit/month. Verify before quoting. | https://azure.microsoft.com/en-us/pricing/details/api-management/ |
| 8 | What are the key scale limits for v2 tiers? | Basic v2 and Standard v2 scale to 10 units; Premium v2 scales to 30 units. Entity limits vary by tier, including APIs, operations, products, subscriptions, and users. | https://learn.microsoft.com/en-us/azure/api-management/v2-service-tiers-overview and https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/azure-subscription-service-limits#azure-api-management-limits |
| 9 | How do token rate limits work? | `llm-token-limit` can enforce tokens-per-minute and token quotas by subscription, IP, or policy expression. It can estimate prompt tokens to reject over-budget calls before backend execution. | https://learn.microsoft.com/en-us/azure/api-management/llm-token-limit-policy |
| 10 | Are token limits global across regions? | No. The brief states token limits are per gateway, not aggregated across regions. Design multi-region quotas with that constraint in mind. | https://learn.microsoft.com/en-us/azure/api-management/llm-token-limit-policy |
| 11 | Can APIM emit token metrics? | Yes. `llm-emit-token-metric` emits prompt, completion, and total token metrics, with up to five custom dimensions. Preview token categories include cached, reasoning, and thinking tokens. | https://learn.microsoft.com/en-us/azure/api-management/llm-emit-token-metric-policy |
| 12 | What about streaming token counting? | Validate streaming behavior for your API and SDK. The policy emits token metrics for supported LLM traffic, and preview categories exist, but production behavior should be tested with the exact streaming pattern. | https://learn.microsoft.com/en-us/azure/api-management/llm-emit-token-metric-policy |
| 13 | Does APIM support semantic caching? | Yes. APIM has `llm-semantic-cache-lookup` and `llm-semantic-cache-store` patterns using embeddings and an external Redis-compatible cache such as Azure Managed Redis. | https://learn.microsoft.com/en-us/azure/api-management/genai-gateway-capabilities |
| 14 | What is PTU-first spillover? | It is a routing pattern where priority routing sends traffic to provisioned capacity first and spills over to another deployment when needed. APIM backend pools and policies can implement this pattern. | https://learn.microsoft.com/en-us/azure/api-management/backends |
| 15 | How does APIM handle 429 outages? | Backend pools, retry policies, and circuit breaker rules can route around overloaded backends. Circuit breaker can honor backend `Retry-After`; it is not available in Consumption. | https://learn.microsoft.com/en-us/azure/api-management/backends |
| 16 | How many backends can a pool have? | Backend pools support up to 30 backends. Circuit breaker is currently limited to one rule per backend. | https://learn.microsoft.com/en-us/azure/api-management/backends |
| 17 | Does APIM support multi-region? | Classic Premium supports multi-region deployment. Premium v2 supports availability zones and VNet injection but the research notes Premium v2 does not list classic multi-region deployment. Validate region architecture by tier. | https://learn.microsoft.com/en-us/azure/api-management/api-management-features |
| 18 | What are workspaces and do v2 tiers support them? | Workspaces support federated API management with team-level administration. Basic v2, Standard v2, Premium, and Premium v2 support workspaces. | https://learn.microsoft.com/en-us/azure/api-management/workspaces-overview |
| 19 | Can MCP servers live inside workspaces? | No. MCP servers are not supported inside workspaces as of the research brief. Plan MCP at the APIM service level. | https://learn.microsoft.com/en-us/azure/api-management/mcp-server-overview |
| 20 | What MCP modes does APIM support? | APIM can expose REST APIs as MCP servers or pass through existing MCP-compatible servers using Streamable HTTP or deprecated SSE/message transports. | https://learn.microsoft.com/en-us/azure/api-management/mcp-server-overview and https://learn.microsoft.com/en-us/azure/api-management/export-rest-mcp-server |
| 21 | Does APIM support MCP resources and prompts? | The brief states MCP support is tools-only; resources and prompts are not supported yet. | https://learn.microsoft.com/en-us/azure/api-management/mcp-server-overview |
| 22 | Can policies apply to MCP tool calls? | Yes. APIM policies can apply to MCP server traffic. The brief also notes `llm-content-safety` covers MCP tool calls and A2A agent traffic. | https://learn.microsoft.com/en-us/azure/api-management/llm-content-safety-policy |
| 23 | What should we avoid in MCP policies? | Do not read `context.Response.Body` in MCP server policies. It forces response buffering and can break required streaming behavior. | https://learn.microsoft.com/en-us/azure/api-management/mcp-server-overview |
| 24 | How is MCP managed through CI/CD? | MCP servers are API resources of type `mcp`. Programmatic management should use API Management REST API `2025-09-01-preview` or later for API tool sub-resources, so tools can be added, renamed, or removed independently. | https://learn.microsoft.com/en-us/azure/api-management/manage-mcp-servers-rest-api |
| 25 | What are A2A agent APIs? | APIM can import A2A agent APIs, mediate JSON-RPC traffic, rewrite the agent card to point through APIM, and emit OpenTelemetry GenAI attributes such as agent ID and name. | https://learn.microsoft.com/en-us/azure/api-management/agent-to-agent-api |
| 26 | Does content safety cover agents? | Yes. The research brief states `llm-content-safety` was extended to protect MCP tool calls and A2A agent API traffic, not only chat completions. | https://learn.microsoft.com/en-us/azure/api-management/llm-content-safety-policy |
| 27 | How does APIM integrate with Microsoft Foundry? | AI gateway in Microsoft Foundry is a preview integration where APIM can be attached to a Foundry project, letting teams configure gateway controls from Foundry while APIM powers the gateway. | https://learn.microsoft.com/en-us/azure/api-management/genai-gateway-capabilities |
| 28 | Why not use Foundry alone? | Foundry is the model, project, agent, and evaluation experience. APIM is the gateway policy layer. The Foundry AI gateway integration uses APIM, so the two are complementary, not competing. | https://learn.microsoft.com/en-us/azure/api-management/genai-gateway-capabilities |
| 29 | Does APIM support Anthropic, Gemini, and Bedrock? | The research states APIM can manage OpenAI Chat Completions/Responses, Anthropic Messages API on v2 tiers, Google Vertex AI/Gemini, Amazon Bedrock, and self-hosted endpoints. Validate preview and tier details before production. | https://learn.microsoft.com/en-us/azure/api-management/genai-gateway-capabilities |
| 30 | What is unified model API? | Unified model API is preview. It provides one OpenAI Chat Completions-shaped endpoint over multiple backends, with automatic format translation, model aliasing, failover, and `/models` discovery. | https://learn.microsoft.com/en-us/azure/api-management/unified-model-api |
| 31 | Can APIM use managed identity to call Foundry? | Yes. APIM can use `authentication-managed-identity` or backend-level managed identity credentials targeting `https://cognitiveservices.azure.com`, removing backend keys from apps. | https://learn.microsoft.com/en-us/azure/api-management/authentication-managed-identity-policy |
| 32 | Can APIM log prompts and completions? | Yes. APIM can send LLM prompt/completion logging to Azure Monitor and Log Analytics. Use this carefully according to data handling policy. | https://learn.microsoft.com/en-us/azure/api-management/genai-gateway-capabilities |
| 33 | What KQL table contains LLM logs? | The demo uses `ApiManagementGatewayLlmLog` to summarize requests, prompt tokens, and completion tokens by deployment. | https://learn.microsoft.com/en-us/azure/api-management/genai-gateway-capabilities |
| 34 | Can we use API Center with AI gateway assets? | Yes. The research notes API Center integration for registering APIs, MCP servers, and agents in an organization catalog, and for Copilot Studio consumption patterns. | https://learn.microsoft.com/en-us/azure/api-management/genai-gateway-capabilities |
| 35 | Does APIM have a self-hosted gateway option? | Yes, but only Developer and Premium classic support self-hosted gateway. It is not available in v2 tiers. Developer self-hosted gateway is free but limited to one replica; Premium classic is paid. | https://learn.microsoft.com/en-us/azure/api-management/api-management-features |
| 36 | Which tier supports private networking? | Standard v2 supports VNet integration for outbound access to isolated backends. Premium v2 supports VNet injection and availability zones. Validate the exact networking requirement by tier. | https://learn.microsoft.com/en-us/azure/api-management/v2-service-tiers-overview |
| 37 | Does APIM replace application-level authorization? | No. APIM provides gateway enforcement such as subscription keys, JWT validation, OAuth patterns, and rate limits. Apps still need business authorization for their own data and actions. | https://learn.microsoft.com/en-us/azure/api-management/genai-gateway-capabilities |
| 38 | How does the demo map teams to policies? | It uses APIM products: Gold for Customer Support Copilot and Bronze for Marketing Sandbox. Product-scope `llm-token-limit` policies enforce different token budgets. | https://learn.microsoft.com/en-us/azure/api-management/llm-token-limit-policy |
| 39 | What happens when Bronze exceeds TPM? | Bronze receives 429 Too Many Requests with `Retry-After`. Gold continues because it has a separate, larger product budget. Monthly quota exhaustion returns 403. | https://learn.microsoft.com/en-us/azure/api-management/llm-token-limit-policy |
| 40 | Where can teams learn more hands-on? | The Azure-Samples/AI-Gateway repository contains 50+ labs covering models, MCP, agents, security, observability, resiliency, semantic caching, and zero-to-production patterns. | https://github.com/Azure-Samples/AI-Gateway |
| 41 | Foundry (new) vs classic: what does this demo use? | The demo uses current Microsoft Foundry resources: `Microsoft.CognitiveServices/accounts` kind `AIServices` with `allowProjectManagement: true`, plus `accounts/projects` projects visible in [ai.azure.com](https://ai.azure.com). It does not use classic hub-based projects or Azure OpenAI resources. APIM model backends target `https://<account>.services.ai.azure.com/openai`; content safety still uses the account's Cognitive Services endpoint. | [ADR-0005](../adr/0005-foundry-new-projects-and-gpt-6-1-sol.md) |
| 42 | Why does the agent use Responses API and run statelessly across regions? | `gpt-6.1-sol` is a reasoning model. `reasoning_effort` supports `low`, `medium`, `high`, and `xhigh`, but not `none`; function tools are not supported on Chat Completions with reasoning. The agent therefore uses `POST /inference/openai/v1/responses`, converts MCP tools to function tools, sets `store=False`, includes `reasoning.encrypted_content`, and resends the full input each turn because an APIM load-balanced follow-up may land in another region that does not know a stored response ID from the previous region. | [ADR-0005](../adr/0005-foundry-new-projects-and-gpt-6-1-sol.md) |

## Demo KQL quick reference

### Token metrics per product

```kusto
AppMetrics
| where TimeGenerated > ago(1d) and Name in ('Prompt Tokens','Completion Tokens','Total Tokens')
| extend Product = tostring(Properties['Product'])
| summarize Tokens = sum(Sum) by Product, Name
```

### LLM logs by deployment

```kusto
ApiManagementGatewayLlmLog
| where TimeGenerated > ago(1d)
| summarize Requests=count(), PromptTokens=sum(PromptTokens), CompletionTokens=sum(CompletionTokens) by DeploymentName
```

## Source URL index

- AI gateway capabilities: https://learn.microsoft.com/en-us/azure/api-management/genai-gateway-capabilities
- MCP server overview: https://learn.microsoft.com/en-us/azure/api-management/mcp-server-overview
- Expose REST API as MCP server: https://learn.microsoft.com/en-us/azure/api-management/export-rest-mcp-server
- Manage MCP servers programmatically: https://learn.microsoft.com/en-us/azure/api-management/manage-mcp-servers-rest-api
- A2A agent APIs: https://learn.microsoft.com/en-us/azure/api-management/agent-to-agent-api
- Unified model API: https://learn.microsoft.com/en-us/azure/api-management/unified-model-api
- Token limit policy: https://learn.microsoft.com/en-us/azure/api-management/llm-token-limit-policy
- Token metric policy: https://learn.microsoft.com/en-us/azure/api-management/llm-emit-token-metric-policy
- Content safety policy: https://learn.microsoft.com/en-us/azure/api-management/llm-content-safety-policy
- Managed identity policy: https://learn.microsoft.com/en-us/azure/api-management/authentication-managed-identity-policy
- Backends, pools, circuit breaker: https://learn.microsoft.com/en-us/azure/api-management/backends
- v2 tiers: https://learn.microsoft.com/en-us/azure/api-management/v2-service-tiers-overview
- Workspaces: https://learn.microsoft.com/en-us/azure/api-management/workspaces-overview
- Feature comparison: https://learn.microsoft.com/en-us/azure/api-management/api-management-features
- Service limits: https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/azure-subscription-service-limits#azure-api-management-limits
- Pricing: https://azure.microsoft.com/en-us/pricing/details/api-management/
