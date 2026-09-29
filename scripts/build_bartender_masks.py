"""Build colour masks for the generated bartender sprite atlases."""

from __future__ import annotations

import argparse
import colorsys
from pathlib import Path

from PIL import Image, ImageFilter


def repeat_hair_mask(source: Path, output: Path) -> None:
    with Image.open(source).convert("RGBA") as image:
        image = image.resize((1644, 957), Image.Resampling.LANCZOS)
        atlas = Image.new("RGBA", (1644, 2871), (255, 255, 255, 0))
        for row in range(3):
            atlas.alpha_composite(image, (0, row * 957))
    output.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(output, optimize=True)


def skin_mask(source: Path, output: Path) -> None:
    with Image.open(source).convert("RGBA") as image:
        pixels = image.load()
        alpha = Image.new("L", image.size, 0)
        mask = alpha.load()
        for y in range(image.height):
            for x in range(image.width):
                red, green, blue, source_alpha = pixels[x, y]
                if source_alpha < 24:
                    continue
                hue, saturation, value = colorsys.rgb_to_hsv(red / 255, green / 255, blue / 255)
                hue_degrees = hue * 360
                # Painted skin stays in a compact warm range.  The extra RGB
                # ratios reject burgundy clothes and most brass details.
                warm_hue = hue_degrees <= 38 or hue_degrees >= 354
                skin = (
                    warm_hue
                    and 0.27 <= saturation <= 0.72
                    and value >= 0.29
                    and red > green * 1.07
                    and green > blue * 1.07
                )
                if skin:
                    mask[x, y] = source_alpha
        alpha = alpha.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.2))
        result = Image.new("RGBA", image.size, (255, 255, 255, 0))
        result.putalpha(alpha)
    output.parent.mkdir(parents=True, exist_ok=True)
    result.save(output, optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=("hair", "skin"))
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if args.mode == "hair":
        repeat_hair_mask(args.source, args.output)
    else:
        skin_mask(args.source, args.output)


if __name__ == "__main__":
    main()
