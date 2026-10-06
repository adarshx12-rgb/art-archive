"""Inventory and resize local references for visual study; originals stay untouched."""
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "inspiration"
CACHE = SOURCE / ".study"
CACHE.mkdir(exist_ok=True)
files, failures = [], []
for path in sorted(SOURCE.rglob("*")):
    if not path.is_file() or CACHE in path.parents or path.suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"}:
        continue
    relative = path.relative_to(SOURCE).as_posix()
    try:
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        with Image.open(path) as original:
            image = ImageOps.exif_transpose(original).convert("RGB")
            width, height = image.size
            # A second hash catches identical decoded pictures with different metadata.
            pixels = hashlib.sha256(f"{width}x{height}".encode() + image.tobytes()).hexdigest()
            thumb = CACHE / f"{pixels}.jpg"
            if not thumb.exists():
                image.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
                image.save(thumb, quality=88)
        files.append({"path": relative, "folder": path.parent.name, "sha256": digest, "imageHash": pixels, "width": width, "height": height, "thumbnail": thumb.relative_to(ROOT).as_posix()})
    except Exception as error:
        failures.append({"path": relative, "error": str(error)})

inventory = {"version": 1, "files": files, "failures": failures, "emptyFolders": [p.name for p in sorted(SOURCE.iterdir()) if p.is_dir() and p != CACHE and not any(f["folder"] == p.name for f in files)]}
(CACHE / "inventory.json").write_text(json.dumps(inventory, indent=2), encoding="utf-8")

# Contact sheets are for auditing the machine's observations against the actual art.
for folder in sorted({f["folder"] for f in files}):
    group = [f for f in files if f["folder"] == folder]
    for start in range(0, len(group), 12):
        batch = group[start:start + 12]
        sheet = Image.new("RGB", (1200, 350 * ((len(batch) + 3) // 4)), "#eeeeee")
        draw = ImageDraw.Draw(sheet)
        for i, item in enumerate(batch):
            with Image.open(ROOT / item["thumbnail"]) as source:
                tile = ImageOps.contain(source, (280, 310))
                x, y = (i % 4) * 300, (i // 4) * 350
                sheet.paste(tile, (x + (300 - tile.width) // 2, y + (310 - tile.height) // 2))
                draw.text((x + 5, y + 315), f'{start + i + 1}: {item["imageHash"][:10]}', fill="black")
        sheet.save(CACHE / f"sheet-{folder}-{start // 12 + 1}.jpg", quality=88)
print(json.dumps({"files": len(files), "uniqueImages": len({f['imageHash'] for f in files}), "failures": failures, "folders": len({f['folder'] for f in files})}))
