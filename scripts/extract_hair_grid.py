"""Split a transparent hair-only grid into named WebP overlays."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output_dir", type=Path)
    parser.add_argument("--columns", type=int, default=5)
    parser.add_argument("--rows", type=int, default=2)
    parser.add_argument("names", nargs="+")
    args = parser.parse_args()
    if len(args.names) != args.columns * args.rows:
        raise SystemExit("The number of names must match columns × rows")

    args.output_dir.mkdir(parents=True, exist_ok=True)
    with Image.open(args.source).convert("RGBA") as source:
        cell_width = source.width / args.columns
        cell_height = source.height / args.rows
        for index, name in enumerate(args.names):
            column = index % args.columns
            row = index // args.columns
            frame = source.crop((
                round(column * cell_width), round(row * cell_height),
                round((column + 1) * cell_width), round((row + 1) * cell_height),
            ))
            alpha = frame.getchannel("A").point(lambda value: 255 if value > 18 else 0)
            bounds = alpha.getbbox()
            if bounds:
                left, top, right, bottom = bounds
                padding = max(4, round(max(frame.size) * .025))
                frame = frame.crop((
                    max(0, left - padding), max(0, top - padding),
                    min(frame.width, right + padding), min(frame.height, bottom + padding),
                ))
            frame.save(args.output_dir / f"{name}.webp", "WEBP", quality=91, method=6)


if __name__ == "__main__":
    main()
