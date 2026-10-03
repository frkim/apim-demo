# ADR-0003: Expose the Zava REST API as an MCP server through API Management

- Status: Accepted
- Date: 2026-10-03

## Context

The session needs to show that API governance now applies to tools and agents, not only model endpoints.
Zava Retail already has ordinary REST capabilities: product search and order status.
The demo should avoid a separate MCP host so the gateway pattern stays visible.

## Decision

Define the Zava Retail REST API from `infra/specs/retail-api.openapi.json`, mock its responses in API Management, and expose its operations as the `zava-retail-mcp` API with MCP tools `search-products` and `get-order-status`.
Bind the REST API and MCP server to the same APIM products so model, tool, and agent calls use the same gateway subscription model.

## Consequences

The demo proves that existing REST operations can become governed MCP tools without introducing another server runtime.
APIM policies can rate-limit and trace MCP calls, and the Python agent can call model and MCP traffic through one gateway.
MCP support is tool-focused; resources and prompts are outside this demo.

## Alternatives considered

- **Standalone MCP server**: rejected because it adds hosting, identity, and deployment complexity unrelated to the core gateway story.
- **Direct REST calls from the agent**: rejected because it would not demonstrate MCP governance.
- **External live retail backend**: rejected because deterministic mocked responses are better for repeatable demos.
