# Video tooling

Builds the narrated demo video. See [docs/video/README.md](../docs/video/README.md) for prerequisites, commands and the transcript.

| Script | Purpose |
| --- | --- |
| `storyboard.py` | Segments: title, visual type, demo command, English narration |
| `capture.py` | Runs the live demo scenarios and records coloured terminal output |
| `narrate.py` | Synthesizes narration with Azure AI Speech (Entra ID, no keys) |
| `render.py` | Renders cards and terminal animations, muxes audio with ffmpeg, writes subtitles |
