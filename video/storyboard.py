"""Storyboard for the narrated demo video: one entry per segment (visual + English narration)."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Segment:
    key: str
    title: str
    visual: str  # "title" | "architecture" | "terminal" | "closing"
    narration: str
    command: str = ""
    scenario: str = ""


SEGMENTS: list[Segment] = [
    Segment(
        key="00-title",
        title="Azure API Management as your AI Gateway",
        visual="title",
        narration=(
            "Welcome. In this short demo, you'll see Azure API Management working as an AI gateway, "
            "in front of Microsoft Foundry models and MCP tools. Everything is live. "
            "The environment was deployed with Bicep, from a GitHub Actions workflow, in Sweden Central and France Central."
        ),
    ),
    Segment(
        key="01-architecture",
        title="Demo architecture",
        visual="architecture",
        narration=(
            "Here is the setup. Apps and agents call one endpoint, on an API Management Basic v2 gateway. "
            "Every request goes through a policy chain: managed identity authentication, content safety, "
            "a token budget per team, and token metrics. A load-balanced backend pool then routes it to "
            "GPT 6.1 Sol, deployed in two Microsoft Foundry projects, in Sweden Central and France Central. "
            "The same gateway also exposes our Zava retail REST API as an MCP server."
        ),
    ),
    Segment(
        key="02-chat",
        title="D1 · Keyless chat through the gateway",
        visual="terminal",
        command="python -m ai_gateway chat",
        scenario="chat",
        narration=(
            "Demo one: a chat completion through the gateway, with the standard OpenAI SDK. "
            "The application only holds an API Management subscription key for the Gold team. "
            "There is no model key anywhere. The gateway authenticates to Microsoft Foundry with its managed identity, "
            "and key authentication is actually disabled on the Foundry resources. "
            "The response headers show which regional backend served the call, the tokens used, "
            "and the tokens left in the team's per-minute budget."
        ),
    ),
    Segment(
        key="03-load-balance",
        title="D2 · Load balancing & failover",
        visual="terminal",
        command="python -m ai_gateway load-balance",
        scenario="load-balance",
        narration=(
            "Demo two: resiliency. Six requests are spread across the backend pool, "
            "alternating between Sweden Central and France Central. Each backend has a circuit breaker. "
            "If a region starts returning 429 or server errors, the gateway trips it for a minute, honors Retry-After, "
            "and retries the request on the healthy region. The client never notices."
        ),
    ),
    Segment(
        key="04-token-limit",
        title="D3 · Token budgets per team",
        visual="terminal",
        command="python -m ai_gateway token-limit",
        scenario="token-limit",
        narration=(
            "Demo three: cost control. The Bronze marketing sandbox gets only three hundred tokens per minute. "
            "Watch the remaining tokens drop with each call, until the gateway answers 429, Too Many Requests, "
            "with a Retry-After header. At the very same moment, the Gold customer support team is still served. "
            "Each product also carries a monthly token quota, enforced by the same LLM token limit policy."
        ),
    ),
    Segment(
        key="05-content-safety",
        title="D4 · Content safety with Prompt Shields",
        visual="terminal",
        command="python -m ai_gateway content-safety",
        scenario="content-safety",
        narration=(
            "Demo four: safety. A normal question goes through. But a jailbreak attempt, asking the model to ignore "
            "its instructions and reveal customer data, is blocked by Prompt Shields at the gateway, with a 403, "
            "before a single token is spent on the model. Hate, self-harm, sexual and violence categories are checked "
            "the same way, for every app, without changing any application code."
        ),
    ),
    Segment(
        key="06-mcp",
        title="D5 · REST API exposed as an MCP server",
        visual="terminal",
        command="python -m ai_gateway mcp",
        scenario="mcp",
        narration=(
            "Demo five: MCP. Our existing Zava retail REST API was turned into an MCP server by API Management, "
            "without writing code. An MCP client initializes a session, lists two tools, search products and get order "
            "status, and calls them. Because the MCP server is an API in the gateway, it gets the same subscription keys, "
            "rate limits and telemetry as everything else."
        ),
    ),
    Segment(
        key="07-agent",
        title="D6 · Agent: model + MCP tools, one gateway",
        visual="terminal",
        command="python -m ai_gateway agent",
        scenario="agent",
        narration=(
            "Demo six: an agent. We ask which outdoor products cost less than one hundred euros, and where my order is. "
            "The agent uses the Responses API. GPT 6.1 Sol, reached through the gateway, decides to call both MCP tools, "
            "also through the gateway, and composes the answer. The conversation is stateless, so each turn can be "
            "served by a different region. Model traffic and tool traffic are governed in one place."
        ),
    ),
    Segment(
        key="08-metrics",
        title="D7 · Token observability & chargeback",
        visual="terminal",
        command="python -m ai_gateway metrics",
        scenario="metrics",
        narration=(
            "Demo seven: observability. The LLM emit token metric policy publishes prompt, completion and total tokens "
            "to Application Insights, with the product as a dimension, so you can show back or charge back AI costs "
            "per team. LLM logging stores prompts and completions in Log Analytics, ready for audits and dashboards."
        ),
    ),
    Segment(
        key="09-closing",
        title="Key takeaways",
        visual="closing",
        narration=(
            "That's the AI gateway: keyless security, token budgets, content safety, resilient load balancing, "
            "MCP and agent governance, and token-level observability, starting at about one hundred fifty dollars "
            "a month with Basic v2. The Bicep, the GitHub Actions workflows and the demo client are in the repository, "
            "and the AI Gateway labs on GitHub take you further. Thanks for watching."
        ),
    ),
]
