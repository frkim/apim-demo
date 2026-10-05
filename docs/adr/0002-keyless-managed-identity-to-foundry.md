# ADR-0002: Use managed identity from API Management to Foundry

- Status: Accepted
- Date: 2026-10-03

## Context

The demo must show how an enterprise removes backend model keys from app code and pipelines.
Current Foundry resources are Microsoft Cognitive Services accounts of kind `AIServices` with `allowProjectManagement: true`, paired with Foundry projects that are visible in [ai.azure.com](https://ai.azure.com).
They support local auth disablement and Entra-backed data-plane access. API Management can authenticate to the Foundry OpenAI v1 data plane through managed identity, while content safety continues to use the account's Cognitive Services endpoint.

## Decision

Disable local auth on the Foundry resources.
Use the API Management system-assigned managed identity for backend calls to `https://<account>.services.ai.azure.com/openai` and content-safety calls to the account's `*.cognitiveservices.azure.com` endpoint.
Assign that identity `Cognitive Services OpenAI User` and `Cognitive Services User` on each Foundry resource.
Assign the deployment/operator identity `Foundry User` on each Foundry resource so presenters can open and use the projects in the current Foundry portal. Apps only hold APIM subscription keys for Gold or Bronze products.

## Consequences

The model provider keys are not distributed to clients or stored in the repository.
APIM becomes the enforcement point for authentication, quotas, content safety, routing, and telemetry across Chat Completions and Responses API traffic.
Operators must preserve RBAC role assignment permissions during deployment and must troubleshoot failed model calls as identity or RBAC issues before looking for missing keys.

## Alternatives considered

- **Foundry local keys in app configuration**: rejected because it recreates key sprawl and contradicts the security standard.
- **User-assigned identity**: deferred because the demo uses one APIM instance and does not need identity reuse across resources.
- **Per-app direct Entra access to Foundry**: rejected for the demo because it bypasses APIM policy controls and token budgets.
