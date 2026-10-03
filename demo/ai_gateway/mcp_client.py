"""Minimal Model Context Protocol client for the Streamable HTTP transport (JSON-RPC 2.0).

Kept dependency-free (httpx only) so the demo shows exactly what travels through the gateway.
"""

from __future__ import annotations

import json
from typing import Any

import httpx

PROTOCOL_VERSION = "2025-06-18"


class McpError(RuntimeError):
    """Raised when the MCP server returns a JSON-RPC error."""


def parse_sse_messages(body: str) -> list[dict[str, Any]]:
    """Extract JSON-RPC messages from a text/event-stream body."""
    messages: list[dict[str, Any]] = []
    data_lines: list[str] = []
    for line in body.splitlines() + [""]:
        if line.startswith("data:"):
            data_lines.append(line[5:].strip())
        elif line.strip() == "" and data_lines:
            payload = "\n".join(data_lines)
            data_lines = []
            try:
                parsed = json.loads(payload)
            except json.JSONDecodeError:
                continue
            if isinstance(parsed, dict):
                messages.append(parsed)
    return messages


class McpClient:
    """Synchronous MCP client: initialize, list tools, call tools."""

    def __init__(self, url: str, headers: dict[str, str] | None = None, timeout: float = 60.0) -> None:
        self.url = url
        self.headers = headers or {}
        self.session_id: str | None = None
        self._next_id = 0
        self._http = httpx.Client(timeout=timeout)

    def __enter__(self) -> McpClient:
        self.initialize()
        return self

    def __exit__(self, *_: object) -> None:
        self._http.close()

    def _request_headers(self) -> dict[str, str]:
        headers = {
            "Accept": "application/json, text/event-stream",
            "Content-Type": "application/json",
            "MCP-Protocol-Version": PROTOCOL_VERSION,
            **self.headers,
        }
        if self.session_id:
            headers["Mcp-Session-Id"] = self.session_id
        return headers

    def _send(self, method: str, params: dict[str, Any] | None = None, notification: bool = False) -> Any:
        payload: dict[str, Any] = {"jsonrpc": "2.0", "method": method}
        if params is not None:
            payload["params"] = params
        if not notification:
            self._next_id += 1
            payload["id"] = self._next_id
        response = self._http.post(self.url, json=payload, headers=self._request_headers())
        response.raise_for_status()
        session_id = response.headers.get("mcp-session-id")
        if session_id:
            self.session_id = session_id
        if notification:
            return None
        if "text/event-stream" in response.headers.get("content-type", ""):
            messages = parse_sse_messages(response.text)
        else:
            messages = [response.json()]
        for message in messages:
            if message.get("id") == payload["id"]:
                if "error" in message:
                    raise McpError(json.dumps(message["error"]))
                return message.get("result")
        raise McpError(f"No JSON-RPC response for request {payload['id']} ({method}).")

    def initialize(self) -> dict[str, Any]:
        result = self._send(
            "initialize",
            {
                "protocolVersion": PROTOCOL_VERSION,
                "capabilities": {},
                "clientInfo": {"name": "ai-gateway-demo", "version": "1.0.0"},
            },
        )
        self._send("notifications/initialized", notification=True)
        return dict(result or {})

    def list_tools(self) -> list[dict[str, Any]]:
        result = self._send("tools/list", {})
        return list((result or {}).get("tools", []))

    def call_tool(self, name: str, arguments: dict[str, Any]) -> str:
        result = self._send("tools/call", {"name": name, "arguments": arguments}) or {}
        parts = [c.get("text", "") for c in result.get("content", []) if c.get("type") == "text"]
        return "\n".join(parts)
