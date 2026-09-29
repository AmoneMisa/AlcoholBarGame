"""Split generated three-panel hair sheets into frame-aligned overlay assets."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


FRAME_SIZE = (548, 957)
SHEET_SIZE = (FRAME_SIZE[0] * 3, FRAME_SIZE[1])


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output_dir", type=Path)
    parser.add_argument("names", nargs=3)
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    with Image.open(args.source).convert("RGBA") as source:
        if source.size != SHEET_SIZE:
            source = source.resize(SHEET_SIZE, Image.Resampling.LANCZOS)
        for index, name in enumerate(args.names):
            frame = source.crop((index * FRAME_SIZE[0], 0, (index + 1) * FRAME_SIZE[0], FRAME_SIZE[1]))
            bounds = frame.getchannel("A").point(lambda value: 255 if value > 24 else 0).getbbox()
            if bounds:
                left, top, right, bottom = bounds
                padding = 5
                frame = frame.crop((max(0, left - padding), max(0, top - padding), min(frame.width, right + padding), min(frame.height, bottom + padding)))
            frame.save(args.output_dir / f"{name}.png", optimize=True)


if __name__ == "__main__":
    main()
