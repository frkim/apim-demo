# ADR-0002: Use managed identity from API Management to Foundry

- Status: Accepted
- Date: 2026-10-03

## Context

The demo must show how an enterprise removes backend model keys from app code and pipelines.
Foundry AI Services accounts support local auth disablement and Entra-backed data-plane access.
API Management can authenticate to Cognitive Services through its managed identity.

## Decision

Disable local auth on the Foundry AI Services accounts.
Use the API Management system-assigned managed identity for backend calls.
Assign that identity `Cognitive Services OpenAI User` and `Cognitive Services User` on each Foundry account.
Apps only hold APIM subscription keys for Gold or Bronze products.

## Consequences

The model provider keys are not distributed to clients or stored in the repository.
APIM becomes the enforcement point for authentication, quotas, content safety, routing, and telemetry.
Operators must preserve RBAC role assignment permissions during deployment and must troubleshoot failed model calls as identity or RBAC issues before looking for missing keys.

## Alternatives considered

- **Foundry local keys in app configuration**: rejected because it recreates key sprawl and contradicts the security standard.
- **User-assigned identity**: deferred because the demo uses one APIM instance and does not need identity reuse across resources.
- **Per-app direct Entra access to Foundry**: rejected for the demo because it bypasses APIM policy controls and token budgets.
