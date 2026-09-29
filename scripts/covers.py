"""Convert the cover PNGs in public/covers to WebP and write the manifest.

    python scripts/covers.py

Files are named after the style slug, optionally with a number:
`gothic.png`, or `gothic1.png`, `gothic2.png`, `gothic3.png`. Image 2 is the
main cover (or the unnumbered file, or the lowest number) unless MAIN below
says otherwise; the rest are shown as similar covers on the style page.
Needs Pillow.
"""
import json
import re
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
COVERS = ROOT / "public" / "covers"
MANIFEST = ROOT / "src" / "content" / "covers.generated.json"
MAX = (1080, 1536)

# File names that differ from the style slug.
ALIASES = {
    "clay-art": "clay-style",
    "gen-x-softclub": "gen-x-soft-club",
    "vapourwave": "vaporwave",
    "cyperpop": "cyberpop",
    "future-punk": "future-funk",
    "web-2-0": "web-2-0-gloss",
}


# Styles whose main cover is not image 2: slug -> image number.
MAIN = {
    "maximalism": 1,
}


def rank(n, main=2):
    """Sort key: the main image first, then unnumbered, then the rest in order."""
    return (0, 0) if n == main else (1, 0) if n is None else (2, n)


groups = {}
for png in sorted(COVERS.glob("*.png")):
    # A trailing number after a letter is an image number; "web-1-0" is a slug.
    m = re.fullmatch(r"(.*[^-\d])(\d+)", png.stem)
    name, num = (m[1], int(m[2])) if m else (png.stem, None)
    slug = ALIASES.get(name, name)
    groups.setdefault(slug, []).append((num, png))

for old in COVERS.glob("*.webp"):
    old.unlink()

manifest = {}
for slug, files in sorted(groups.items()):
    entries = []
    for i, (num, png) in enumerate(sorted(files, key=lambda f: rank(f[0], MAIN.get(slug, 2)))):
        out = COVERS / (f"{slug}.webp" if i == 0 else f"{slug}-{num or i + 1}.webp")
        im = Image.open(png).convert("RGB")
        im.thumbnail(MAX, Image.LANCZOS)
        im.save(out, "WEBP", quality=80, method=6)
        entries.append({"src": f"/covers/{out.name}", "file": png.name, "width": im.width, "height": im.height})
        print(f"{png.name:28} -> {out.name} {im.size} {out.stat().st_size // 1024} KB")
    manifest[slug] = entries

MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
print(f"{len(manifest)} styles, {sum(map(len, manifest.values()))} images -> {MANIFEST.relative_to(ROOT)}")
