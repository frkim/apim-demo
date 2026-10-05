# Demo client

The `ai_gateway` package runs the live Zava Retail demo scenarios against the deployed API Management AI gateway.
It uses APIM subscription keys for client access and lets APIM use managed identity to call Foundry.

## Install

```powershell
cd demo
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Package restore must use the Microsoft-protected PyPI feed configured on the workstation: `https://packagefeedproxy.microsoft.io/pypi/simple`.

## Configuration

By default, the client resolves configuration from Azure CLI and resource group `rg-apimaigw-demo-swc`.
Run `az login` and select the demo subscription before launching scenarios.

| Variable | Required | Purpose |
| --- | --- | --- |
| `AZURE_RESOURCE_GROUP` | No | Resource group to inspect; defaults to `rg-apimaigw-demo-swc`. |
| `APIM_NAME` | No | APIM service name, used for display when known. |
| `APIM_GATEWAY_URL` | No | Gateway URL override, for example `https://<name>.azure-api.net`. |
| `APIM_GOLD_KEY` | No | Gold product subscription key override. |
| `APIM_BRONZE_KEY` | No | Bronze product subscription key override. |
| `LOG_ANALYTICS_WORKSPACE_ID` | No | Workspace customer ID for KQL queries. |
| `AI_GATEWAY_MODEL` | No | Model deployment name; defaults to `gpt-6.1-sol`. |

## Scenarios

Run all scenarios:

```powershell
python -m ai_gateway all
```

Run one scenario:

```powershell
python -m ai_gateway chat
```

| Scenario | Command | What it demonstrates | Expected output summary |
| --- | --- | --- | --- |
| D1 | `python -m ai_gateway chat` | OpenAI SDK traffic through APIM; APIM uses managed identity to Foundry. | HTTP 200 through Sweden Central, 44/94 tokens, 19,862 remaining. |
| D2 | `python -m ai_gateway load-balance` | Weighted backend pool across Sweden Central and France Central. | Six HTTP 200 rows alternating France Central and Sweden Central. |
| D3 | `python -m ai_gateway token-limit` | Bronze product `llm-token-limit` enforcement. | Bronze succeeds six times with remaining tokens 239, 176, 123, 81, 9, and 0, then HTTP 429 with `Retry-After: 11`; Gold still returns HTTP 200. |
| D4 | `python -m ai_gateway content-safety` | Prompt Shields and harm-category filtering at the gateway. | Benign prompt returns `REI Co-op Half Dome SL 2+...`; jailbreak prompt returns HTTP 403 with `Request failed content safety check.` |
| D5 | `python -m ai_gateway mcp` | APIM-generated MCP server from the Zava REST API. | `tools/list` shows `search-products` and `get-order-status`; order `ORD-1042` is `Out for delivery`. |
| D6 | `python -m ai_gateway agent` | Responses API model turns and MCP tool calls governed by the same gateway. | Agent calls `search-products` and `get-order-status`, then answers with `Trail backpack 30L (€89.90)`, `Headlamp 400lm (€34.50)`, and `ORD-1042` out for delivery with Zava Express. |
| D7 | `python -m ai_gateway metrics` | Token metrics and LLM logs through KQL. | Rows from `AppMetrics` and `ApiManagementGatewayLlmLog` after ingestion delay. |

## Development quality gates

```powershell
python -m pip install -r requirements-dev.txt
python -m ruff check .
python -m ruff format --check .
python -m mypy ai_gateway
python -m pytest -q
```

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `Azure CLI 'az' not found` | Install Azure CLI or set `APIM_GATEWAY_URL`, `APIM_GOLD_KEY`, `APIM_BRONZE_KEY`, and `LOG_ANALYTICS_WORKSPACE_ID`. |
| `No API Management instance found` | Set `AZURE_RESOURCE_GROUP` or deploy the Bicep stack first. |
| Bronze does not throttle | Re-run `token-limit` or increase prompt length; token counts can vary. |
| Bronze throttles too soon in rehearsal | Wait 60 seconds for the TPM bucket to refill. |
| First content-safety call returns 500 | Retry once; the content safety backend can be cold immediately after deployment. |
| Agent function tools fail on Chat Completions | Use the `agent` scenario's Responses API path; `gpt-6.1-sol` is a reasoning model and does not support function tools on Chat Completions with reasoning. |
| Metrics show no rows | Wait several minutes for telemetry ingestion, then run `python -m ai_gateway metrics` again. |
| MCP call fails after policy edits | Avoid reading `context.Response.Body` in MCP policies because buffering can break streaming responses. |

See the presenter flow in [../docs/narrative/demo-script.md](../docs/narrative/demo-script.md).
