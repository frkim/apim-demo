"""Unit tests for the demo client helpers (no Azure access required)."""

from __future__ import annotations

import json

import httpx
import pytest

from ai_gateway import cli, scenarios
from ai_gateway.config import DemoConfig
from ai_gateway.mcp_client import McpClient, McpError, parse_sse_messages

CFG = DemoConfig(
    resource_group="rg-test",
    apim_name="apim-test",
    gateway_url="https://apim-test.azure-api.net",
    gold_key="gold",
    bronze_key="bronze",
    model="gpt-5.4-nano",
    log_analytics_workspace_id="",
)


def test_config_urls() -> None:
    assert CFG.inference_base_url == "https://apim-test.azure-api.net/inference/openai/v1"
    assert CFG.mcp_url == "https://apim-test.azure-api.net/zava-mcp/mcp"
    assert CFG.retail_url == "https://apim-test.azure-api.net/zava"


def test_parse_sse_messages_extracts_json_events() -> None:
    body = 'event: message\ndata: {"jsonrpc":"2.0","id":1,"result":{"ok":true}}\n\ndata: not-json\n\n'
    assert parse_sse_messages(body) == [{"jsonrpc": "2.0", "id": 1, "result": {"ok": True}}]


def test_parse_sse_messages_handles_trailing_event_without_blank_line() -> None:
    assert parse_sse_messages('data: {"id":2}') == [{"id": 2}]


def test_to_openai_tools_converts_mcp_descriptors() -> None:
    tools = [{"name": "search-products", "description": "Search", "inputSchema": {"type": "object", "properties": {}}}]
    converted = scenarios.to_openai_tools(tools)
    assert converted == [
        {
            "type": "function",
            "function": {
                "name": "search-products",
                "description": "Search",
                "parameters": {"type": "object", "properties": {}},
            },
        }
    ]


def test_to_openai_tools_defaults_missing_schema() -> None:
    converted = scenarios.to_openai_tools([{"name": "ping"}])
    assert converted[0]["function"]["parameters"] == {"type": "object", "properties": {}}


@pytest.mark.parametrize(
    ("schema", "expected"),
    [
        ({"properties": {"category": {"type": "string"}}}, {"category": "outdoor"}),
        (
            {"properties": {"query": {"type": "object", "properties": {"category": {"type": "string"}}}}},
            {"query": {"category": "outdoor"}},
        ),
        ({"properties": {"other": {"type": "string"}}}, {}),
    ],
)
def test_tool_arguments_maps_flat_and_nested_schemas(schema: dict[str, object], expected: dict[str, object]) -> None:
    tool = {"name": "search-products", "inputSchema": schema}
    assert scenarios._tool_arguments(tool, {"category": "outdoor"}) == expected


def _mock_mcp_transport() -> httpx.MockTransport:
    def handler(request: httpx.Request) -> httpx.Response:
        payload = json.loads(request.content)
        assert request.headers["api-key"] == "gold"
        method = payload["method"]
        if method == "notifications/initialized":
            assert request.headers["Mcp-Session-Id"] == "session-1"
            return httpx.Response(202)
        if method == "initialize":
            result = {"serverInfo": {"name": "Azure API Management"}}
            return httpx.Response(
                200,
                json={"jsonrpc": "2.0", "id": payload["id"], "result": result},
                headers={"mcp-session-id": "session-1"},
            )
        if method == "tools/list":
            sse = (
                f"data: {json.dumps({'jsonrpc': '2.0', 'id': payload['id'], 'result': {'tools': [{'name': 't'}]}})}\n\n"
            )
            return httpx.Response(200, text=sse, headers={"content-type": "text/event-stream"})
        if method == "tools/call":
            if payload["params"]["name"] == "boom":
                return httpx.Response(200, json={"jsonrpc": "2.0", "id": payload["id"], "error": {"code": -1}})
            content = [{"type": "text", "text": "hello"}, {"type": "image", "data": "x"}]
            return httpx.Response(200, json={"jsonrpc": "2.0", "id": payload["id"], "result": {"content": content}})
        return httpx.Response(404)

    return httpx.MockTransport(handler)


def test_mcp_client_round_trip() -> None:
    client = McpClient("https://example/mcp", headers={"api-key": "gold"})
    client._http = httpx.Client(transport=_mock_mcp_transport())
    with client:
        assert client.session_id == "session-1"
        assert client.list_tools() == [{"name": "t"}]
        assert client.call_tool("t", {}) == "hello"
        with pytest.raises(McpError):
            client.call_tool("boom", {})


def test_cli_rejects_unknown_scenario() -> None:
    with pytest.raises(SystemExit):
        cli.main(["unknown"])


def test_cli_lists_all_demo_scenarios() -> None:
    assert list(cli.SCENARIOS) == ["chat", "load-balance", "token-limit", "content-safety", "mcp", "agent", "metrics"]
