"""Run the live demo scenarios in-process and record the coloured terminal output for the video."""

from __future__ import annotations

import io
import json
import sys
import time
from pathlib import Path
from typing import Any

from rich.console import Console
from rich.segment import Segment

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "demo"))

from ai_gateway import cli  # noqa: E402
from ai_gateway.config import load_config  # noqa: E402
from storyboard import SEGMENTS  # noqa: E402

WIDTH = 104
BUILD = Path(__file__).resolve().parent / "build" / "captures"


def _style_of(segment: Segment) -> dict[str, Any]:
    style = segment.style
    colour = None
    if style is not None and style.color is not None and not style.color.is_default:
        triplet = style.color.get_truecolor()
        colour = f"#{triplet.red:02x}{triplet.green:02x}{triplet.blue:02x}"
    return {"color": colour, "bold": bool(style and style.bold), "dim": bool(style and style.dim)}


def capture(scenario: str) -> list[list[dict[str, Any]]]:
    console = Console(record=True, width=WIDTH, force_terminal=True, color_system="truecolor", file=io.StringIO())
    cli.console = console
    cfg = load_config()
    ok = cli.SCENARIOS[scenario](cfg)
    if not ok:
        print(f"warning: scenario {scenario} did not behave as expected", file=sys.stderr)
    lines = []
    for line in Segment.split_lines(console._record_buffer):  # noqa: SLF001 - rich exposes no public API for styled segments
        lines.append([{"text": seg.text, **_style_of(seg)} for seg in line if seg.text])
    return lines


def main() -> int:
    BUILD.mkdir(parents=True, exist_ok=True)
    only = set(sys.argv[1:])
    for segment in SEGMENTS:
        if not segment.scenario or (only and segment.scenario not in only):
            continue
        if segment.scenario == "token-limit":
            print("waiting 65 s so the Bronze token bucket is full...")
            time.sleep(65)
        if segment.scenario == "metrics":
            print("waiting 120 s for telemetry ingestion...")
            time.sleep(120)
        print(f"capturing {segment.scenario}...")
        lines = capture(segment.scenario)
        (BUILD / f"{segment.key}.json").write_text(json.dumps(lines, ensure_ascii=False), encoding="utf-8")
        print(f"  {len(lines)} lines")
    return 0


if __name__ == "__main__":
    sys.exit(main())
