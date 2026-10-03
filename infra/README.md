# Infrastructure

The `infra/` folder deploys the Azure API Management AI Gateway demo at subscription scope.
`main.bicep` creates the resource group and delegates workload resources to `resources.bicep`, which composes monitoring, API Management, Foundry AI Services, and gateway policies.

## Resources

| Resource | Bicep location | Purpose |
| --- | --- | --- |
| Resource group `rg-apimaigw-demo-swc` | [main.bicep](main.bicep) | Container for the demo workload. |
| Log Analytics workspace | [modules/monitoring.bicep](modules/monitoring.bicep) | APIM platform logs, Foundry metrics, and LLM logs. |
| Application Insights | [modules/monitoring.bicep](modules/monitoring.bicep) | Request telemetry and custom token metrics. |
| API Management Basic v2 | [modules/apim.bicep](modules/apim.bicep) | Public AI gateway with system-assigned managed identity. |
| Foundry AI Services accounts | [modules/foundry.bicep](modules/foundry.bicep) | Regional model backends in Sweden Central and France Central. |
| Model deployments | [modules/foundry.bicep](modules/foundry.bicep) | `gpt-5.4-nano` GlobalStandard deployments at 50K TPM. |
| Inference API | [modules/ai-gateway.bicep](modules/ai-gateway.bicep) | OpenAI v1-compatible path `/inference/openai/v1`. |
| Backend pool | [modules/ai-gateway.bicep](modules/ai-gateway.bicep) | Load-balanced `foundry-pool` with circuit breakers. |
| Products and subscriptions | [modules/ai-gateway.bicep](modules/ai-gateway.bicep) | Gold and Bronze team budgets and keys. |
| Zava REST API | [specs/retail-api.openapi.json](specs/retail-api.openapi.json) | Mocked product search and order status API. |
| Zava MCP server | [modules/ai-gateway.bicep](modules/ai-gateway.bicep) | `/zava-mcp/mcp` tools generated from REST operations. |

## Parameters

| Parameter | Default | Description |
| --- | --- | --- |
| `workload` | `apimaigw` | Short workload name used in resource names. |
| `environmentName` | `demo` | Environment name and tag value. |
| `location` | `swedencentral` | Primary region for APIM, monitoring, and first Foundry backend. |
| `locationShort` | `swc` | Short region code in the resource group name. |
| `foundryBackends` | Sweden Central and France Central | Regional Foundry backends with priority and weight. |
| `modelName` | `gpt-5.4-nano` | Model deployment name. |
| `modelVersion` | `2026-03-17` | Model version. |
| `modelCapacity` | `50` | GlobalStandard deployment capacity in thousands of TPM. |
| `apimSku` | `BasicV2` | APIM SKU; allowed values are `BasicV2`, `StandardV2`, `PremiumV2`, and `Developer`. |
| `publisherEmail` | `apim-demo@contoso.com` | APIM publisher email. |
| `owner` | `apim-demo` | Required owner tag. |
| `costCenter` | `demo` | Required cost center tag. |

## Outputs

| Output | Description |
| --- | --- |
| `resourceGroupName` | Created resource group name. |
| `apimName` | API Management service name. |
| `apimGatewayUrl` | APIM gateway base URL. |
| `inferenceBaseUrl` | OpenAI-compatible base URL ending in `/inference/openai/v1`. |
| `mcpEndpoint` | MCP endpoint ending in `/zava-mcp/mcp`. |
| `modelDeploymentName` | Deployed model name. |
| `foundryEndpoints` | Regional Foundry endpoint list. |
| `primaryFoundryId` | Resource ID of the primary Foundry account. |
| `primaryFoundryLocation` | Primary Foundry region. |
| `appInsightsName` | Application Insights component name. |
| `logAnalyticsCustomerId` | Workspace customer ID used by the demo client. |

## Policies

| Policy | Purpose |
| --- | --- |
| [policies/inference-api.xml](policies/inference-api.xml) | Managed identity to Foundry, content safety, token metrics, backend pool routing, retry, and safe error headers. |
| [policies/product-token-budget.xml](policies/product-token-budget.xml) | Product-scope `llm-token-limit` for tokens per minute and monthly quota. |
| [policies/retail-api.xml](policies/retail-api.xml) | Mocked Zava REST API responses for product search and order status. |
| [policies/retail-mcp.xml](policies/retail-mcp.xml) | MCP per-subscription rate limit and trace metadata. |

APIM policy expressions are embedded in XML-like policy documents and are not strict XML for generic validators.
Use APIM validation, Bicep build, and live smoke tests as the source of truth.

## Deploy

```powershell
az login
az account set --subscription '<subscription-id-or-name>'
az bicep install
az deployment sub what-if -n apimaigw-demo -l swedencentral -f infra\main.bicep --result-format ResourceIdOnly
az deployment sub create -n apimaigw-demo -l swedencentral -f infra\main.bicep
```

## Validate

```powershell
az bicep build --file infra\main.bicep --stdout > $null
az bicep lint --file infra\main.bicep
```

After deployment, run the smoke scenarios:

```powershell
cd demo
python -m ai_gateway chat
python -m ai_gateway content-safety
python -m ai_gateway mcp
```

## Clean up

Use the **Destroy AI Gateway demo** GitHub Actions workflow when possible.
It deletes `rg-apimaigw-*` resource groups and purges soft-deleted AI Services and APIM instances.

Local cleanup starts with:

```powershell
az group delete --name rg-apimaigw-demo-swc --yes
```

If you need to reuse APIM names, list and purge soft-deleted APIM services after deletion.
