"""Download CC-BY attending assets from Sketchfab after a logged-in session.

Usage:
  python3 Scripts/download-sketchfab-attending.py --cookie-header '...'
  SKETCHFAB_TOKEN=... python3 Scripts/download-sketchfab-attending.py

Models:
  Male Lab Coat and Pants  77b6039abd6a4d7c8f1ebfea537510b5  CC-BY 4.0 zeryshahid
  Rigged Stethoscope       e0d5ec7eb4c842599205c6f65b14bdd3  CC-BY 4.0
"""

from __future__ import annotations

import argparse
import json
import os
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "Content" / "Environment" / "Source" / "Sketchfab"
OUT.mkdir(parents=True, exist_ok=True)

MODELS = [
    {
        "uid": "77b6039abd6a4d7c8f1ebfea537510b5",
        "slug": "lab-coat",
        "credit": "Male Lab Coat and Pants by zeryshahid, CC BY 4.0",
        "url": "https://sketchfab.com/3d-models/male-lab-coat-and-pants-77b6039abd6a4d7c8f1ebfea537510b5",
    },
    {
        "uid": "e0d5ec7eb4c842599205c6f65b14bdd3",
        "slug": "stethoscope",
        "credit": "Rigged Stethoscope, CC BY 4.0",
        "url": "https://sketchfab.com/3d-models/rigged-stethoscope-e0d5ec7eb4c842599205c6f65b14bdd3",
    },
]


def opener(cookie_header: str | None, token: str | None):
    handlers = [urllib.request.HTTPRedirectHandler()]
    build = urllib.request.build_opener(*handlers)
    headers = {"User-Agent": "CardioHospital-attending-kit/1.0"}
    if token:
        headers["Authorization"] = f"Token {token}"
    if cookie_header:
        headers["Cookie"] = cookie_header
    build.addheaders = list(headers.items())
    return build


def download_model(op, model) -> dict:
    api = f"https://api.sketchfab.com/v3/models/{model['uid']}/download"
    try:
        with op.open(api, timeout=60) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"{model['uid']} download API {error.code}: {body[:400]}") from error

    dest = OUT / model["slug"]
    dest.mkdir(parents=True, exist_ok=True)
    (dest / "download.json").write_text(json.dumps(payload, indent=2) + "\n")
    saved = []
    for kind in ("gltf", "glb", "usdz", "source"):
        entry = payload.get(kind) or {}
        url = entry.get("url")
        if not url:
            continue
        ext = "zip" if kind in {"gltf", "source"} else kind
        path = dest / f"{model['slug']}.{ext}"
        with op.open(url, timeout=180) as response:
            path.write_bytes(response.read())
        saved.append(str(path))
        print(f"saved {path} bytes={path.stat().st_size}")
    if not saved:
        raise RuntimeError(f"{model['uid']} returned no file URLs: {payload.keys()}")
    (dest / "CREDIT.txt").write_text(model["credit"] + "\n" + model["url"] + "\n")
    return {"uid": model["uid"], "files": saved, "credit": model["credit"]}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cookie-header", default=os.environ.get("SKETCHFAB_COOKIE", ""))
    parser.add_argument("--token", default=os.environ.get("SKETCHFAB_TOKEN", ""))
    args = parser.parse_args()
    if not args.cookie_header and not args.token:
        raise SystemExit("Need --cookie-header or SKETCHFAB_TOKEN after you log in.")
    op = opener(args.cookie_header or None, args.token or None)
    report = [download_model(op, model) for model in MODELS]
    (OUT / "manifest.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
