"""Resolve demo configuration from environment variables or, if missing, from Azure via the Azure CLI.

Subscription keys are API Management consumer keys. They are fetched at runtime and never written to disk.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
from dataclasses import dataclass
from functools import lru_cache

APIM_API_VERSION = "2024-06-01-preview"
DEFAULT_RESOURCE_GROUP = "rg-apimaigw-demo-swc"


class ConfigError(RuntimeError):
    """Raised when the demo configuration cannot be resolved."""


@dataclass(frozen=True)
class DemoConfig:
    resource_group: str
    apim_name: str
    gateway_url: str
    gold_key: str
    bronze_key: str
    model: str
    log_analytics_workspace_id: str

    @property
    def inference_base_url(self) -> str:
        return f"{self.gateway_url}/inference/openai/v1"

    @property
    def mcp_url(self) -> str:
        return f"{self.gateway_url}/zava-mcp/mcp"

    @property
    def retail_url(self) -> str:
        return f"{self.gateway_url}/zava"


def _az(*args: str) -> str:
    az = shutil.which("az") or shutil.which("az.cmd")
    if az is None:
        raise ConfigError("Azure CLI 'az' not found; set the APIM_* environment variables instead.")
    result = subprocess.run([az, *args, "-o", "json"], capture_output=True, text=True, check=False)
    if result.returncode != 0:
        raise ConfigError(f"az {' '.join(args[:3])} failed: {result.stderr.strip()}")
    return result.stdout


def _subscription_key(apim_id: str, subscription_name: str) -> str:
    out = _az(
        "rest",
        "--method",
        "post",
        "--uri",
        f"https://management.azure.com{apim_id}/subscriptions/{subscription_name}/listSecrets"
        f"?api-version={APIM_API_VERSION}",
    )
    return str(json.loads(out)["primaryKey"])


@lru_cache(maxsize=1)
def load_config() -> DemoConfig:
    """Return the demo configuration, querying Azure only for values not provided by the environment."""
    resource_group = os.environ.get("AZURE_RESOURCE_GROUP", DEFAULT_RESOURCE_GROUP)
    model = os.environ.get("AI_GATEWAY_MODEL", "gpt-6.1-sol")
    gateway_url = os.environ.get("APIM_GATEWAY_URL", "")
    gold_key = os.environ.get("APIM_GOLD_KEY", "")
    bronze_key = os.environ.get("APIM_BRONZE_KEY", "")
    workspace_id = os.environ.get("LOG_ANALYTICS_WORKSPACE_ID", "")
    apim_name = os.environ.get("APIM_NAME", "")

    if not (gateway_url and gold_key and bronze_key and workspace_id):
        services = json.loads(
            _az("resource", "list", "-g", resource_group, "--resource-type", "Microsoft.ApiManagement/service")
        )
        if not services:
            raise ConfigError(f"No API Management instance found in resource group '{resource_group}'.")
        apim_id = services[0]["id"]
        apim_name = services[0]["name"]
        apim = json.loads(_az("resource", "show", "--ids", apim_id))
        gateway_url = gateway_url or apim["properties"]["gatewayUrl"]
        gold_key = gold_key or _subscription_key(apim_id, "gold-team")
        bronze_key = bronze_key or _subscription_key(apim_id, "bronze-team")
        if not workspace_id:
            workspaces = json.loads(
                _az(
                    "resource",
                    "list",
                    "-g",
                    resource_group,
                    "--resource-type",
                    "Microsoft.OperationalInsights/workspaces",
                )
            )
            if workspaces:
                ws = json.loads(_az("resource", "show", "--ids", workspaces[0]["id"]))
                workspace_id = ws["properties"]["customerId"]

    return DemoConfig(
        resource_group=resource_group,
        apim_name=apim_name,
        gateway_url=gateway_url.rstrip("/"),
        gold_key=gold_key,
        bronze_key=bronze_key,
        model=model,
        log_analytics_workspace_id=workspace_id,
    )
