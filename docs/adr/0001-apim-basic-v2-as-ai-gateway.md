# ADR-0001: Use API Management Basic v2 as the AI gateway tier

- Status: Accepted
- Date: 2026-10-03

## Context

The demo needs an Azure API gateway that can govern OpenAI-compatible model traffic, enforce AI policies, expose a REST API as an MCP server, route across multiple Foundry backends, and emit token telemetry.
The environment must stay inexpensive enough for repeatable demos while still showing the enterprise controls used in production patterns.

## Decision

Use Azure API Management Basic v2 as the default gateway SKU.
Deploy one unit in Sweden Central through Bicep and place the inference API, products, backend pool, MCP server, diagnostics, and subscriptions on that service.

## Consequences

Basic v2 keeps the monthly gateway cost low for the demo and supports the AI gateway and MCP capabilities needed by the session.
The demo remains a non-production reference and does not claim production scale, zone redundancy, private networking, or classic multi-region APIM features.
Teams that need isolated networking, higher scale, or production resiliency must review Standard v2, Premium v2, or another approved topology.

## Alternatives considered

- **Consumption**: rejected because the demo depends on MCP server and circuit breaker capabilities that are not available there.
- **Developer**: rejected because it is useful for labs but does not represent the v2 tier story used in the session.
- **Standard v2 or Premium v2**: rejected for the default demo because the extra cost and capabilities are not required to prove the scenario.
