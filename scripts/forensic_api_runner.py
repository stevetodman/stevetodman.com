#!/usr/bin/env python3
"""Run GitHub-surface audit modes with redirect-safe authenticated downloads.

GitHub's logs/artifact endpoints redirect to signed blob URLs. curl -L safely
handles the cross-host redirect without forwarding repository credentials.
Matched values are still never emitted by the underlying scanners.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import tempfile
from pathlib import Path

import forensic_repo_audit as base
import forensic_audit_extras as extras

TOKEN = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN") or ""


def curl_api_get(path_or_url: str, *, binary: bool = False, timeout: int = 180) -> bytes:
    url = path_or_url if path_or_url.startswith("http") else f"https://api.github.com/repos/{base.REPO}/{path_or_url.lstrip('/')}"
    with tempfile.TemporaryDirectory() as td:
        dest = Path(td) / "response.bin"
        cmd = [
            "curl", "--fail", "--silent", "--show-error", "--location",
            "--retry", "3", "--retry-all-errors", "--max-time", str(timeout),
            "-H", f"User-Agent: {base.UA}",
            "-H", "Accept: application/vnd.github+json",
            "-H", "X-GitHub-Api-Version: 2022-11-28",
        ]
        if TOKEN:
            cmd += ["-H", f"Authorization: Bearer {TOKEN}"]
        cmd += ["--output", str(dest), url]
        p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False, timeout=timeout + 30)
        if p.returncode != 0:
            detail = p.stderr.decode("utf-8", "replace")[:200]
            raise RuntimeError(f"curl_rc_{p.returncode}:{detail}")
        data = dest.read_bytes()
        if len(data) > base.MAX_DOWNLOAD:
            raise ValueError(f"download exceeds {base.MAX_DOWNLOAD} bytes")
        return data


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", required=True, choices=["surfaces", "actions-logs", "actions-artifacts"])
    ap.add_argument("--out", required=True)
    ap.add_argument("--shard", type=int, default=0)
    ap.add_argument("--shards", type=int, default=1)
    args = ap.parse_args()

    # Patch the single network primitive used by api_json, surface downloads,
    # action log downloads, and action artifact downloads.
    base.api_get = curl_api_get

    out = Path(args.out)
    if args.mode == "surfaces":
        base.scan_surfaces(out)
    elif args.mode == "actions-logs":
        extras.actions_logs(out, args.shard, args.shards)
    elif args.mode == "actions-artifacts":
        extras.actions_artifacts(out, args.shard, args.shards)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
