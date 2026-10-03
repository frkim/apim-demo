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
| `AI_GATEWAY_MODEL` | No | Model deployment name; defaults to `gpt-5.4-nano`. |

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
| D1 | `python -m ai_gateway chat` | OpenAI SDK traffic through APIM; APIM uses managed identity to Foundry. | HTTP 200, model answer, backend headers, token headers. |
| D2 | `python -m ai_gateway load-balance` | Weighted backend pool across Sweden Central and France Central. | Six HTTP 200 rows with both regions represented. |
| D3 | `python -m ai_gateway token-limit` | Bronze product `llm-token-limit` enforcement. | Bronze receives HTTP 429 with `Retry-After`; Gold still returns HTTP 200. |
| D4 | `python -m ai_gateway content-safety` | Prompt Shields and harm-category filtering at the gateway. | Benign prompt succeeds; jailbreak prompt returns HTTP 403. |
| D5 | `python -m ai_gateway mcp` | APIM-generated MCP server from the Zava REST API. | `tools/list` shows `search-products` and `get-order-status`; both calls return data. |
| D6 | `python -m ai_gateway agent` | Model and MCP tool calls governed by the same gateway. | Agent calls both tools and answers the user question. |
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
| Metrics show no rows | Wait several minutes for telemetry ingestion, then run `python -m ai_gateway metrics` again. |
| MCP call fails after policy edits | Avoid reading `context.Response.Body` in MCP policies because buffering can break streaming responses. |

See the presenter flow in [../docs/narrative/demo-script.md](../docs/narrative/demo-script.md).
