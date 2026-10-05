"""Synthesize the English narration with Azure AI Speech using Microsoft Entra ID (no keys).

The token comes from the Azure CLI. The identity needs the 'Cognitive Services Speech User' role on the
Foundry resource; infra/modules/foundry.bicep grants it to the deployment identity.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import wave
from pathlib import Path
from xml.sax.saxutils import escape

import httpx

from storyboard import SEGMENTS

BUILD = Path(__file__).resolve().parent / "build" / "audio"
VOICES = ["en-US-Andrew:DragonHDLatestNeural", "en-US-AndrewMultilingualNeural"]


def _az(*args: str) -> str:
    az = shutil.which("az") or shutil.which("az.cmd")
    if az is None:
        raise RuntimeError("Azure CLI not found")
    return subprocess.run([az, *args], capture_output=True, text=True, check=True).stdout.strip()


def speech_endpoint() -> str:
    if os.environ.get("SPEECH_ENDPOINT"):
        return os.environ["SPEECH_ENDPOINT"].rstrip("/")
    group = os.environ.get("AZURE_RESOURCE_GROUP", "rg-apimaigw-demo-swc")
    accounts = json.loads(_az("cognitiveservices", "account", "list", "-g", group, "-o", "json"))
    primary = sorted(accounts, key=lambda a: a["location"] != "swedencentral")[0]
    return str(primary["properties"]["endpoint"]).rstrip("/")


def synthesize(text: str, voice: str, token: str, endpoint: str) -> bytes:
    ssml = (
        "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>"
        f"<voice name='{voice}'><prosody rate='+4%'>{escape(text)}</prosody></voice></speak>"
    )
    response = httpx.post(
        f"{endpoint}/tts/cognitiveservices/v1",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": "riff-24khz-16bit-mono-pcm",
            "User-Agent": "apim-ai-gateway-demo",
        },
        content=ssml.encode("utf-8"),
        timeout=120,
    )
    response.raise_for_status()
    return response.content


def duration_seconds(path: Path) -> float:
    with wave.open(str(path), "rb") as wav:
        return wav.getnframes() / float(wav.getframerate())


def main() -> int:
    BUILD.mkdir(parents=True, exist_ok=True)
    endpoint = speech_endpoint()
    token = _az(
        "account",
        "get-access-token",
        "--resource",
        "https://cognitiveservices.azure.com",
        "--query",
        "accessToken",
        "-o",
        "tsv",
    )
    for segment in SEGMENTS:
        target = BUILD / f"{segment.key}.wav"
        for voice in VOICES:
            try:
                target.write_bytes(synthesize(segment.narration, voice, token, endpoint))
                break
            except httpx.HTTPStatusError as error:
                print(f"voice {voice} failed ({error.response.status_code}), trying next", file=sys.stderr)
        print(f"{segment.key}: {duration_seconds(target):.1f} s")
    return 0


if __name__ == "__main__":
    sys.exit(main())
