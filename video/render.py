"""Render the narrated demo video: title/architecture/closing cards + animated terminal replays of the live demo.

Inputs : build/captures/*.json (capture.py) and build/audio/*.wav (narrate.py)
Outputs: docs/video/apim-ai-gateway-demo.mp4 and docs/video/apim-ai-gateway-demo.en.srt
"""

from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
import wave
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont

from storyboard import SEGMENTS, Segment

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
BUILD = HERE / "build"
FRAMES = BUILD / "frames"
OUTPUT_DIR = ROOT / "docs" / "video"
VIDEO = OUTPUT_DIR / "apim-ai-gateway-demo.mp4"
SUBTITLES = OUTPUT_DIR / "apim-ai-gateway-demo.en.srt"

W, H = 1920, 1080
NAVY, NAVY_2 = (11, 30, 63), (16, 42, 86)
TEAL, BLUE, AMBER = (0, 183, 195), (0, 120, 212), (255, 185, 0)
WHITE, OFFWHITE, SLATE = (255, 255, 255), (245, 247, 250), (59, 74, 94)
TERM_BG, TERM_FG = (13, 17, 23), (220, 226, 232)
PAD_AFTER = 0.9  # seconds of silence after each narration

FONT_DIRS = [Path("C:/Windows/Fonts"), Path("/usr/share/fonts/truetype/dejavu")]


def font(names: list[str], size: int) -> ImageFont.FreeTypeFont:
    for directory in FONT_DIRS:
        for name in names:
            path = directory / name
            if path.exists():
                return ImageFont.truetype(str(path), size)
    return ImageFont.load_default(size)


MONO = font(["consola.ttf", "DejaVuSansMono.ttf"], 24)
MONO_BOLD = font(["consolab.ttf", "DejaVuSansMono-Bold.ttf"], 24)
H1 = font(["seguisb.ttf", "DejaVuSans-Bold.ttf"], 72)
H2 = font(["seguisb.ttf", "DejaVuSans-Bold.ttf"], 42)
H3 = font(["seguisb.ttf", "DejaVuSans-Bold.ttf"], 30)
BODY = font(["segoeui.ttf", "DejaVuSans.ttf"], 28)
SMALL = font(["segoeui.ttf", "DejaVuSans.ttf"], 22)
SUB = font(["segoeui.ttf", "DejaVuSans.ttf"], 31)


def hex_rgb(value: str | None, default: tuple[int, int, int]) -> tuple[int, int, int]:
    if not value:
        return default
    return int(value[1:3], 16), int(value[3:5], 16), int(value[5:7], 16)


def readable(colour: tuple[int, int, int]) -> tuple[int, int, int]:
    """Brighten dark ANSI colours (for example rich 'red' = #800000) so they stay legible on the dark terminal."""
    peak = max(colour)
    if peak and peak < 200:
        colour = tuple(min(255, int(c * 255 / peak)) for c in colour)  # type: ignore[assignment]
    return tuple(int(c * 0.7 + 255 * 0.3) for c in colour)  # type: ignore[return-value]


# ---------------------------------------------------------------- common chrome


def background() -> Image.Image:
    img = Image.new("RGB", (W, H), NAVY)
    draw = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        draw.line([(0, y), (W, y)], fill=tuple(int(NAVY[i] * (1 - t) + NAVY_2[i] * t) for i in range(3)))
    draw.rectangle([0, 0, 12, H], fill=TEAL)
    return img


def wrap(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.FreeTypeFont, width: int) -> list[str]:
    words, lines, line = text.split(), [], ""
    for word in words:
        trial = f"{line} {word}".strip()
        if draw.textlength(trial, font=fnt) <= width:
            line = trial
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def subtitle(img: Image.Image, text: str) -> None:
    if not text:
        return
    draw = ImageDraw.Draw(img, "RGBA")
    lines = wrap(draw, text, SUB, W - 360)[:2]
    box_h = 26 + 44 * len(lines)
    top = H - box_h - 24
    draw.rounded_rectangle([160, top, W - 160, H - 24], radius=14, fill=(0, 0, 0, 170))
    for i, line in enumerate(lines):
        x = (W - draw.textlength(line, font=SUB)) / 2
        draw.text((x, top + 13 + i * 44), line, font=SUB, fill=WHITE)


def header(img: Image.Image, title: str) -> None:
    draw = ImageDraw.Draw(img)
    draw.text((70, 42), title, font=H2, fill=WHITE)
    tag = "Azure API Management · AI Gateway · live demo"
    draw.text((W - 70 - draw.textlength(tag, font=SMALL), 56), tag, font=SMALL, fill=TEAL)


# ---------------------------------------------------------------- cards


def title_card() -> Image.Image:
    img = background()
    draw = ImageDraw.Draw(img)
    draw.ellipse([1340, -260, 2240, 640], outline=TEAL, width=6)
    draw.ellipse([1440, -160, 2140, 540], outline=BLUE, width=3)
    draw.text((140, 300), "Azure API Management", font=H1, fill=WHITE)
    draw.text((140, 390), "as your AI Gateway", font=H1, fill=TEAL)
    draw.text(
        (140, 510),
        "Govern models, MCP tools and agents — keyless, budgeted, safe, observable",
        font=BODY,
        fill=OFFWHITE,
    )
    chips = ["APIM Basic v2", "Microsoft Foundry", "gpt-5.4-nano", "MCP", "Bicep + GitHub Actions"]
    x = 140
    for chip in chips:
        w = draw.textlength(chip, font=SMALL) + 40
        draw.rounded_rectangle([x, 600, x + w, 648], radius=24, outline=TEAL, width=2)
        draw.text((x + 20, 610), chip, font=SMALL, fill=WHITE)
        x += w + 18
    draw.text((140, 720), "October 2026 · Sweden Central + France Central", font=SMALL, fill=(160, 175, 195))
    return img


def box(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int, int, int],
    title: str,
    lines: list[str],
    border: tuple[int, int, int],
    fill: tuple[int, int, int] = (20, 48, 92),
) -> None:  # noqa: E501
    draw.rounded_rectangle(xy, radius=16, fill=fill, outline=border, width=3)
    draw.text((xy[0] + 22, xy[1] + 14), title, font=H3, fill=WHITE)
    for i, line in enumerate(lines):
        draw.text((xy[0] + 22, xy[1] + 58 + i * 32), line, font=SMALL, fill=OFFWHITE)


def arrow(
    draw: ImageDraw.ImageDraw, start: tuple[int, int], end: tuple[int, int], colour: tuple[int, int, int] = TEAL
) -> None:  # noqa: E501
    draw.line([start, end], fill=colour, width=4)
    ex, ey = end
    sx, sy = start
    direction = 1 if ex >= sx else -1
    draw.polygon([(ex, ey), (ex - 16 * direction, ey - 9), (ex - 16 * direction, ey + 9)], fill=colour)


def architecture_card() -> Image.Image:
    img = background()
    header(img, "Demo architecture")
    draw = ImageDraw.Draw(img)
    box(draw, (70, 190, 450, 330), "Gold team app", ["OpenAI SDK · 20K tokens/min", "5M tokens / month"], BLUE)
    box(draw, (70, 360, 450, 500), "Bronze sandbox", ["OpenAI SDK · 300 tokens/min", "100K tokens / month"], BLUE)
    box(draw, (70, 530, 450, 670), "Agent / MCP client", ["Model calls + MCP tools", "one subscription key"], BLUE)

    draw.rounded_rectangle((560, 160, 1300, 830), radius=22, fill=(9, 24, 50), outline=TEAL, width=4)
    draw.text((590, 178), "API Management · AI gateway (Basic v2)", font=H3, fill=TEAL)
    pills = [
        ("authentication-managed-identity", "keyless to Foundry"),
        ("llm-content-safety", "Prompt Shields + harm categories"),
        ("llm-token-limit (product scope)", "TPM + monthly quota per team"),
        ("llm-emit-token-metric", "tokens by product → App Insights"),
        ("backend pool + circuit breaker", "weighted 50/50 · retry on 429/5xx"),
        ("MCP server /zava-mcp", "tools from the REST API"),
    ]
    for i, (name, note) in enumerate(pills):
        y = 240 + i * 96
        colour = AMBER if name.startswith("MCP") else TEAL
        draw.rounded_rectangle((600, y, 1260, y + 78), radius=14, fill=(18, 40, 78), outline=colour, width=2)
        draw.text((624, y + 8), name, font=MONO, fill=WHITE)
        draw.text((624, y + 42), note, font=SMALL, fill=(170, 190, 210))

    box(
        draw,
        (1420, 190, 1850, 330),
        "Foundry · Sweden Central",
        ["gpt-5.4-nano · GlobalStandard", "key auth disabled"],
        TEAL,
    )
    box(
        draw,
        (1420, 360, 1850, 500),
        "Foundry · France Central",
        ["gpt-5.4-nano · GlobalStandard", "key auth disabled"],
        TEAL,
    )
    box(draw, (1420, 560, 1850, 700), "Zava Retail REST API", ["search-products", "get-order-status"], AMBER)
    box(
        draw,
        (560, 860, 1300, 960),
        "Application Insights · Log Analytics",
        ["token metrics · LLM prompt/completion logs"],
        BLUE,
        fill=(14, 36, 70),
    )  # noqa: E501

    for y in (260, 430, 600):
        arrow(draw, (450, y), (560, y))
    arrow(draw, (1300, 260), (1420, 260))
    arrow(draw, (1300, 430), (1420, 430))
    arrow(draw, (1300, 630), (1420, 630), AMBER)
    draw.line([(930, 830), (930, 860)], fill=BLUE, width=4)
    return img


def closing_card() -> Image.Image:
    img = background()
    header(img, "Key takeaways")
    draw = ImageDraw.Draw(img)
    cards = [
        ("Keyless security", "Managed identity to every model; apps hold only a gateway key."),
        ("Token budgets", "Per-team tokens/min + monthly quotas with llm-token-limit."),
        ("Content safety", "Prompt Shields + harm categories before the model is called."),
        ("Resiliency", "Backend pools, circuit breakers, retries across regions."),
        ("MCP & agents", "REST APIs become governed MCP servers; one control point."),
        ("Observability", "Token metrics per product, LLM logs, chargeback."),
    ]
    for i, (title, text) in enumerate(cards):
        col, row = i % 3, i // 3
        x, y = 90 + col * 590, 190 + row * 300
        draw.rounded_rectangle((x, y, x + 550, y + 260), radius=18, fill=(20, 48, 92))
        draw.rectangle((x, y + 18, x + 8, y + 242), fill=TEAL)
        draw.text((x + 34, y + 30), title, font=H3, fill=WHITE)
        for j, line in enumerate(wrap(draw, text, BODY, 480)):
            draw.text((x + 34, y + 90 + j * 40), line, font=BODY, fill=OFFWHITE)
    links = "github.com/frkim/apim-demo   ·   github.com/Azure-Samples/AI-Gateway   ·   azure.github.io/api-management-resources"
    draw.text(((W - draw.textlength(links, font=SMALL)) / 2, 820), links, font=SMALL, fill=TEAL)
    return img


# ---------------------------------------------------------------- terminal


TERM_BOX = (70, 130, W - 70, 900)
LINE_H = 31
VISIBLE = (TERM_BOX[3] - TERM_BOX[1] - 70) // LINE_H


def terminal_frame(title: str, command: str, typed: int, lines: list[list[dict[str, Any]]], shown: int) -> Image.Image:
    img = background()
    header(img, title)
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle(TERM_BOX, radius=16, fill=TERM_BG, outline=(48, 60, 78), width=2)
    draw.rounded_rectangle((TERM_BOX[0], TERM_BOX[1], TERM_BOX[2], TERM_BOX[1] + 44), radius=16, fill=(30, 38, 50))
    draw.rectangle((TERM_BOX[0], TERM_BOX[1] + 30, TERM_BOX[2], TERM_BOX[1] + 44), fill=(30, 38, 50))
    for i, colour in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
        draw.ellipse(
            (TERM_BOX[0] + 20 + i * 28, TERM_BOX[1] + 14, TERM_BOX[0] + 36 + i * 28, TERM_BOX[1] + 30), fill=colour
        )
    draw.text((TERM_BOX[0] + 120, TERM_BOX[1] + 10), "pwsh — demo", font=SMALL, fill=(150, 160, 175))

    rows: list[list[dict[str, Any]]] = [
        [
            {"text": "PS demo> ", "color": "#00b7c3", "bold": True},
            {"text": command[:typed], "color": None, "bold": True},
        ]
    ]
    if typed >= len(command):
        rows += lines[:shown]
    rows = rows[-VISIBLE:]
    cell = MONO.getlength("M")
    y = TERM_BOX[1] + 60
    for row in rows:
        col = 0
        for seg in row:
            fnt = MONO_BOLD if seg.get("bold") else MONO
            colour = readable(hex_rgb(seg.get("color"), TERM_FG)) if seg.get("color") else TERM_FG
            if seg.get("dim"):
                colour = tuple(int(c * 0.8) for c in colour)
            # Draw on a fixed character grid so box-drawing borders and bold runs stay aligned.
            for ch in seg["text"]:
                draw.text((TERM_BOX[0] + 28 + col * cell, y), ch, font=fnt, fill=colour)
                col += 1
        y += LINE_H
    return img


# ---------------------------------------------------------------- timeline


@dataclass
class Frame:
    image: Path
    duration: float


def sentences(text: str) -> list[str]:
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]


def caption_schedule(text: str, start: float, duration: float) -> list[tuple[float, float, str]]:
    parts = sentences(text)
    total = sum(len(p) for p in parts) or 1
    schedule, t = [], start
    for part in parts:
        span = duration * len(part) / total
        schedule.append((t, t + span, part))
        t += span
    return schedule


def caption_at(schedule: list[tuple[float, float, str]], t: float) -> str:
    for begin, end, text in schedule:
        if begin <= t < end:
            return text
    return ""


def wav_seconds(path: Path) -> float:
    with wave.open(str(path), "rb") as wav:
        return wav.getnframes() / float(wav.getframerate())


def build_segment(
    segment: Segment, index: int, start: float
) -> tuple[list[Frame], float, list[tuple[float, float, str]]]:
    audio = wav_seconds(BUILD / "audio" / f"{segment.key}.wav")
    total = audio + PAD_AFTER
    captions = caption_schedule(segment.narration, 0.0, audio)
    events: list[tuple[float, Any]] = []

    if segment.visual == "terminal":
        lines = json.loads((BUILD / "captures" / f"{segment.key}.json").read_text(encoding="utf-8"))
        type_start, cps = 0.5, 22.0
        for n in range(0, len(segment.command) + 1):
            events.append((type_start + n / cps, ("term", n, 0)))
        reveal_start = type_start + len(segment.command) / cps + 0.5
        reveal_span = max(1.0, min(total * 0.7, len(lines) * 0.35))
        for k in range(1, len(lines) + 1):
            events.append((reveal_start + reveal_span * k / len(lines), ("term", len(segment.command), k)))
        events.insert(0, (0.0, ("term", 0, 0)))
    else:
        events.append((0.0, ("card",)))
    for begin, _end, _text in captions:
        events.append((begin, None))
    events.append((audio, None))
    events.sort(key=lambda e: e[0])

    card_cache: Image.Image | None = None
    state: Any = events[0][1]
    frames: list[Frame] = []
    times = sorted({round(min(t, total - 0.05), 3) for t, _ in events})
    for i, t in enumerate(times):
        for when, value in events:
            if when <= t + 1e-6 and value is not None:
                state = value
        if state[0] == "term":
            img = terminal_frame(segment.title, segment.command, state[1], lines, state[2])
        else:
            if card_cache is None:
                card_cache = {"title": title_card, "architecture": architecture_card, "closing": closing_card}[
                    segment.visual
                ]()
            img = card_cache.copy()
        subtitle(img, caption_at(captions, t))
        path = FRAMES / f"{index:02d}-{i:04d}.png"
        img.save(path, optimize=False, compress_level=1)
        end = times[i + 1] if i + 1 < len(times) else total
        frames.append(Frame(path, max(end - t, 0.034)))
    absolute = [(start + b, start + e, txt) for b, e, txt in captions]
    return frames, total, absolute


def srt_time(seconds: float) -> str:
    ms = int(round(seconds * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def main() -> int:
    ffmpeg = shutil.which("ffmpeg")
    if ffmpeg is None:
        print("ffmpeg is required", file=sys.stderr)
        return 1
    if FRAMES.exists():
        shutil.rmtree(FRAMES)
    FRAMES.mkdir(parents=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    all_frames: list[Frame] = []
    captions: list[tuple[float, float, str]] = []
    audio_parts: list[tuple[Path, float]] = []
    clock = 0.0
    for index, segment in enumerate(SEGMENTS):
        frames, total, segment_captions = build_segment(segment, index, clock)
        all_frames += frames
        captions += segment_captions
        audio_parts.append((BUILD / "audio" / f"{segment.key}.wav", total))
        clock += total
        print(f"{segment.key}: {len(frames)} frames, {total:.1f} s")

    # Narration track: each clip padded with silence to its segment length.
    narration = BUILD / "narration.wav"
    with wave.open(str(audio_parts[0][0]), "rb") as first:
        params = first.getparams()
    with wave.open(str(narration), "wb") as out:
        out.setparams(params)
        for path, total in audio_parts:
            with wave.open(str(path), "rb") as clip:
                data = clip.readframes(clip.getnframes())
            out.writeframes(data)
            pad = int(total * params.framerate) - len(data) // (params.sampwidth * params.nchannels)
            out.writeframes(b"\x00" * max(pad, 0) * params.sampwidth * params.nchannels)

    concat = BUILD / "frames.txt"
    with concat.open("w", encoding="utf-8") as listing:
        for frame in all_frames:
            listing.write(f"file '{frame.image.as_posix()}'\nduration {frame.duration:.3f}\n")
        listing.write(f"file '{all_frames[-1].image.as_posix()}'\n")

    subprocess.run(
        [
            ffmpeg,
            "-y",
            "-loglevel",
            "error",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(concat),
            "-i",
            str(narration),
            "-vf",
            "fps=30,format=yuv420p",
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "22",
            "-tune",
            "stillimage",
            "-c:a",
            "aac",
            "-b:a",
            "160k",
            "-movflags",
            "+faststart",
            "-shortest",
            str(VIDEO),
        ],
        check=True,
    )
    with SUBTITLES.open("w", encoding="utf-8") as srt:
        for i, (begin, end, text) in enumerate(captions, start=1):
            srt.write(f"{i}\n{srt_time(begin)} --> {srt_time(end)}\n{text}\n\n")
    print(f"video: {VIDEO} ({clock:.1f} s), subtitles: {SUBTITLES}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
