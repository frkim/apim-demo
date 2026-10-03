"""Command line entry point: python -m ai_gateway <scenario>."""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from collections.abc import Callable

from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from . import scenarios
from .config import ConfigError, DemoConfig, load_config

console = Console()

AGENT_QUESTION = "Which outdoor products do you have under 100 EUR, and where is my order ORD-1042?"


def _title(code: str, text: str) -> None:
    console.rule(f"[bold cyan]{code}[/] {text}")


def run_chat(cfg: DemoConfig) -> bool:
    _title("D1", "Keyless chat through the AI gateway")
    console.print(f"[dim]POST {cfg.inference_base_url}/chat/completions  (api-key: Gold team subscription key)[/]")
    result = scenarios.chat(cfg, "In one sentence, why should a retailer put an AI gateway in front of its models?")
    console.print(Panel(result.answer, title=f"{cfg.model} answer", border_style="green"))
    table = Table("Header / metric", "Value")
    table.add_row("HTTP status", str(result.status))
    table.add_row("x-ai-gateway-backend", result.backend)
    table.add_row("x-ms-region", result.region)
    table.add_row("prompt / completion tokens", f"{result.prompt_tokens} / {result.completion_tokens}")
    table.add_row("x-ratelimit-remaining-tokens", result.remaining_tokens)
    table.add_row("latency", f"{result.latency_ms} ms")
    console.print(table)
    return result.status == 200 and bool(result.answer)


def run_load_balance(cfg: DemoConfig) -> bool:
    _title("D2", "Load balancing across regional Foundry backends")
    rows = scenarios.load_balance(cfg)
    table = Table("#", "Status", "Backend", "Region", "Latency (ms)")
    for row in rows:
        table.add_row(str(row["request"]), str(row["status"]), row["backend"], row["region"], str(row["latency_ms"]))
    console.print(table)
    spread = Counter(row["region"] for row in rows)
    console.print(f"Distribution: {dict(spread)}")
    return all(row["status"] == 200 for row in rows)


def run_token_limit(cfg: DemoConfig) -> bool:
    _title("D3", "Token budgets per team (Bronze: 300 tokens/min)")
    rows = scenarios.token_limit(cfg)
    table = Table("#", "Status", "Tokens consumed", "Remaining tokens/min", "Retry-After (s)")
    for row in rows:
        style = "bold red" if row["status"] == 429 else ""
        table.add_row(
            str(row["request"]),
            f"[{style}]{row['status']}[/]" if style else str(row["status"]),
            row["tokens_consumed"],
            row["remaining_tokens"],
            row["retry_after"],
        )
    console.print(table)
    throttled = any(row["status"] == 429 for row in rows)
    console.print(
        "[bold red]429 Too Many Requests[/] - the gateway protected the shared model capacity."
        if throttled
        else "No 429 yet."
    )
    gold = scenarios.chat(cfg, "Say 'Gold team still served'.", max_tokens=40)
    console.print(f"Gold team at the same moment: HTTP {gold.status} - {gold.answer}")
    return throttled and gold.status == 200


def run_content_safety(cfg: DemoConfig) -> bool:
    _title("D4", "Content safety: Prompt Shields at the gateway")
    results = scenarios.content_safety(cfg)
    for result in results:
        colour = "green" if result.status == 200 else "red"
        console.print(
            Panel(
                f"[bold]Prompt:[/] {result.prompt}\n\n[bold]HTTP {result.status}[/]\n{result.message}",
                border_style=colour,
            )
        )
    return results[0].status == 200 and results[1].status in (400, 403)


def run_mcp(cfg: DemoConfig) -> bool:
    _title("D5", "MCP server generated from the Zava Retail REST API")
    console.print(f"[dim]MCP endpoint: {cfg.mcp_url}[/]")
    result = scenarios.mcp_tools(cfg)
    console.print(f"Server: {result.server}")
    table = Table("Tool", "Description")
    for tool in result.tools:
        table.add_row(tool["name"], tool.get("description", ""))
    console.print(table)
    for call in result.calls:
        console.print(
            Panel(
                call["result"], title=f"tools/call {call['tool']} {json.dumps(call['arguments'])}", border_style="cyan"
            )
        )
    return len(result.tools) >= 2 and len(result.calls) == 2 and all(c["result"] for c in result.calls)


def run_agent(cfg: DemoConfig) -> bool:
    _title("D6", "Agent: model + MCP tools, both governed by the gateway")
    console.print(f"[bold]User:[/] {AGENT_QUESTION}")
    result = scenarios.agent(cfg, AGENT_QUESTION)
    for step in result.tool_calls:
        console.print(f"[cyan]tool call[/] {step['tool']}({json.dumps(step['arguments'])}) -> {step['result'][:160]}")
    console.print(Panel(result.answer, title="Agent answer", border_style="green"))
    return bool(result.tool_calls) and bool(result.answer)


def run_metrics(cfg: DemoConfig) -> bool:
    _title("D7", "Observability: token usage per team + LLM logs")
    console.print("[dim]Telemetry ingestion takes a few minutes after the calls.[/]")
    ok = True
    for label, query in (
        ("Token metrics (AppMetrics)", scenarios.TOKEN_USAGE_QUERY),
        ("LLM logs", scenarios.LLM_LOG_QUERY),
    ):
        rows = scenarios.log_query(cfg, query)
        console.print(f"[bold]{label}[/]")
        if not rows:
            console.print("  (no rows yet)")
            continue
        table = Table(*rows[0].keys())
        for row in rows:
            table.add_row(*(str(v) for v in row.values()))
        console.print(table)
        ok = ok and "error" not in rows[0]
    return ok


SCENARIOS: dict[str, Callable[[DemoConfig], bool]] = {
    "chat": run_chat,
    "load-balance": run_load_balance,
    "token-limit": run_token_limit,
    "content-safety": run_content_safety,
    "mcp": run_mcp,
    "agent": run_agent,
    "metrics": run_metrics,
}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="ai_gateway", description="Azure API Management AI gateway demo")
    parser.add_argument("scenario", choices=[*SCENARIOS, "all"], help="Scenario to run")
    args = parser.parse_args(argv)
    try:
        cfg = load_config()
    except ConfigError as error:
        console.print(f"[red]Configuration error:[/] {error}")
        return 2
    console.print(f"[dim]Gateway: {cfg.gateway_url}  |  model: {cfg.model}[/]")
    names = list(SCENARIOS) if args.scenario == "all" else [args.scenario]
    failures = []
    for name in names:
        try:
            if not SCENARIOS[name](cfg):
                failures.append(name)
        except Exception as error:  # noqa: BLE001 - demo should report and continue
            console.print(f"[red]{name} failed:[/] {error}")
            failures.append(name)
    if failures:
        console.print(f"[red]Scenarios with unexpected results: {', '.join(failures)}[/]")
        return 1
    console.print("[bold green]All scenarios behaved as expected.[/]")
    return 0


if __name__ == "__main__":
    sys.exit(main())
