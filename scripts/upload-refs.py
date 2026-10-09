"""Upload a small thumbnail of every usable reference to the private store the director looks at.

    python scripts/upload-refs.py            # local dev storage (.wrangler/state)
    python scripts/upload-refs.py --remote   # the real KV namespace on Cloudflare

Usable means it has a compiled gold prompt (worker/data/gold-prompts.json). Each is
the study thumbnail resized to 768 px on its long side, stored as <id>.jpg in the
KV namespace bound as REFS. One bulk upload per run; a manifest per target skips
unchanged images and removes references no longer usable. Run after
scripts/gold-prompts.mjs. Needs Pillow. The store is private: the Worker reads it
through its REFS binding; nothing is published. (KV for now; R2 later.)
"""
import base64
import io
import json
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
STUDY = ROOT / "inspiration" / ".study"
SIZE = 768
target = "--remote" if "--remote" in sys.argv else "--local"
manifest_path = STUDY / f"refs-uploaded-{target.strip('-')}.json"

gold = json.loads((ROOT / "worker" / "data" / "gold-prompts.json").read_text(encoding="utf8"))["references"]
inventory = json.loads((STUDY / "inventory.json").read_text(encoding="utf8"))["files"]
hash_of = {f["imageHash"][:16]: f["imageHash"] for f in inventory}
usable = {g["id"]: hash_of[g["id"]] for g in gold if g["id"] in hash_of}
done = json.loads(manifest_path.read_text(encoding="utf8")) if manifest_path.exists() else {}

# npx on Windows is a .cmd script, which subprocess only runs through the shell.
NPX = "npx.cmd" if sys.platform == "win32" else "npx"


def bulk(command: str, entries: list) -> None:
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf8") as tmp:
        json.dump(entries, tmp)
        path = tmp.name
    try:
        subprocess.run([NPX, "wrangler", "kv", "bulk", command, path, "--binding", "REFS", target, *(["--force"] if command == "delete" else [])], cwd=ROOT, check=True, capture_output=True)
    finally:
        Path(path).unlink(missing_ok=True)


def thumbnail(image_hash: str) -> bytes:
    with Image.open(STUDY / f"{image_hash}.jpg") as image:
        image = image.convert("RGB")
        image.thumbnail((SIZE, SIZE))
        out = io.BytesIO()
        image.save(out, "JPEG", quality=80)
        return out.getvalue()


todo = {i: h for i, h in usable.items() if done.get(i) != h}
gone = [i for i in done if i not in usable]
entries, total = [], 0
for ref_id, image_hash in todo.items():
    data = thumbnail(image_hash)
    total += len(data)
    entries.append({"key": f"{ref_id}.jpg", "value": base64.b64encode(data).decode("ascii"), "base64": True})

if entries:
    bulk("put", entries)
    done.update(todo)
if gone:
    bulk("delete", [f"{i}.jpg" for i in gone])
    for i in gone:
        done.pop(i, None)

manifest_path.write_text(json.dumps(done, indent=2), encoding="utf8")
print(json.dumps({"target": target, "usable": len(usable), "uploaded": len(entries), "removed": len(gone), "bytes": total}))
