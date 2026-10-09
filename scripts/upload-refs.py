"""Upload a small thumbnail of every usable reference to the private R2 bucket the director looks at.

    python scripts/upload-refs.py            # local dev storage (.wrangler/state)
    python scripts/upload-refs.py --remote   # the real bucket (create it once: npx wrangler r2 bucket create inspiration-refs)

Usable means it has a compiled gold prompt (worker/data/gold-prompts.json). Each is
the study thumbnail resized to 768 px on its long side, uploaded as <id>.jpg. A
manifest per target skips unchanged images and removes references no longer usable.
Run after scripts/gold-prompts.mjs. Needs Pillow. The bucket is private: the
Worker reads it through its REFS binding; nothing is published.
"""
import json
import subprocess
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
STUDY = ROOT / "inspiration" / ".study"
BUCKET = "inspiration-refs"
SIZE = 768
target = "--remote" if "--remote" in sys.argv else "--local"
# Local storage is one SQLite file: parallel writers lock each other out.
WORKERS = 6 if target == "--remote" else 1
manifest_path = STUDY / f"refs-uploaded-{target.strip('-')}.json"

gold = json.loads((ROOT / "worker" / "data" / "gold-prompts.json").read_text(encoding="utf8"))["references"]
inventory = json.loads((STUDY / "inventory.json").read_text(encoding="utf8"))["files"]
hash_of = {f["imageHash"][:16]: f["imageHash"] for f in inventory}
usable = {g["id"]: hash_of[g["id"]] for g in gold if g["id"] in hash_of}
done = json.loads(manifest_path.read_text(encoding="utf8")) if manifest_path.exists() else {}

# npx on Windows is a .cmd script, which subprocess only runs through the shell.
NPX = "npx.cmd" if sys.platform == "win32" else "npx"


def wrangler(*args: str) -> None:
    subprocess.run([NPX, "wrangler", "r2", "object", *args, target], cwd=ROOT, check=True, capture_output=True)


def upload(item: tuple[str, str]) -> int:
    ref_id, image_hash = item
    with Image.open(STUDY / f"{image_hash}.jpg") as image:
        image = image.convert("RGB")
        image.thumbnail((SIZE, SIZE))
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            image.save(tmp, "JPEG", quality=80)
            path = tmp.name
    size = Path(path).stat().st_size
    try:
        wrangler("put", f"{BUCKET}/{ref_id}.jpg", "--file", path, "--content-type", "image/jpeg")
    finally:
        Path(path).unlink(missing_ok=True)
    return size


todo = [(i, h) for i, h in usable.items() if done.get(i) != h]
gone = [i for i in done if i not in usable]
total = 0
failed = []


def _run(item):
    try:
        return item, upload(item), None
    except Exception as error:  # report and carry on; the manifest only records successes
        return item, 0, error


with ThreadPoolExecutor(max_workers=WORKERS) as pool:
    for (ref_id, image_hash), size, error in pool.map(_run, todo):
        if error:
            failed.append(ref_id)
            continue
        done[ref_id] = image_hash
        total += size
for ref_id in gone:
    try:
        wrangler("delete", f"{BUCKET}/{ref_id}.jpg")
        done.pop(ref_id, None)
    except subprocess.CalledProcessError:
        failed.append(ref_id)

manifest_path.write_text(json.dumps(done, indent=2), encoding="utf8")
print(json.dumps({"target": target, "usable": len(usable), "uploaded": len(todo) - len([f for f in failed if f in dict(todo)]), "removed": len(gone), "failed": failed, "bytes": total}))
if failed:
    sys.exit(1)
