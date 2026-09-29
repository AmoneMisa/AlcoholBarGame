"""Assemble three 3-pose bartender rows into one outfit/pose atlas.

The game addresses the atlas as three columns (poses) by three rows
(vest, shirt, apron).  Image generation can vary output by a pixel, so every
row is normalised to a stable 1644 x 957 frame before it is stacked.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


ROW_SIZE = (1644, 957)


def build(rows: list[Path], output: Path) -> None:
    atlas = Image.new("RGBA", (ROW_SIZE[0], ROW_SIZE[1] * len(rows)), (0, 0, 0, 0))
    for row_index, source in enumerate(rows):
        with Image.open(source).convert("RGBA") as image:
            if image.size != ROW_SIZE:
                image = image.resize(ROW_SIZE, Image.Resampling.LANCZOS)
            atlas.alpha_composite(image, (0, row_index * ROW_SIZE[1]))
    output.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(output, optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("output", type=Path)
    parser.add_argument("rows", nargs=3, type=Path, metavar="ROW")
    args = parser.parse_args()
    build(args.rows, args.output)


if __name__ == "__main__":
    main()
