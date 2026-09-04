#!/usr/bin/env python3
"""Scan pre-audit GitHub Actions artifacts via per-run endpoints.

Never emits matched values. Findings are delegated to the repository's redacted
Scanner and contain only pattern IDs, locations, line numbers, object IDs, and
status metadata.
"""
from __future__ import annotations

import argparse
import io
import json
import os
import urllib.request
import zipfile
from pathlib import Path

from forensic_repo_audit import Scanner, REPO, TOKEN, UA, append_jsonl

CUTOFF = os.environ.get("AUDIT_CUTOFF", "2026-09-04T21:47:49Z")
MAX_DOWNLOAD = 250 * 1024 * 1024


def api_json(path: str) -> object:
    req = urllib.request.Request(
        f"https://api.github.com/repos/{REPO}/{path.lstrip('/')}",
        headers={
            "User-Agent": UA,
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            **({"Authorization": f"Bearer {TOKEN}"} if TOKEN else {}),
        },
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def api_bytes(path: str) -> bytes:
    req = urllib.request.Request(
        f"https://api.github.com/repos/{REPO}/{path.lstrip('/')}",
        headers={
            "User-Agent": UA,
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            **({"Authorization": f"Bearer {TOKEN}"} if TOKEN else {}),
        },
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = resp.read(MAX_DOWNLOAD + 1)
        if len(data) > MAX_DOWNLOAD:
            raise ValueError("artifact archive exceeds scan limit")
        return data


def list_pre_audit_runs() -> list[dict]:
    runs: list[dict] = []
    page = 1
    while True:
        obj = api_json(f"actions/runs?per_page=100&page={page}")
        batch = obj.get("workflow_runs", []) if isinstance(obj, dict) else []
        if not batch:
            break
        for run in batch:
            created = str(run.get("created_at", ""))
            if created and created <= CUTOFF:
                runs.append(run)
        if len(batch) < 100:
            break
        page += 1
    return runs


def run_artifacts(run_id: int) -> list[dict]:
    out: list[dict] = []
    page = 1
    while True:
        obj = api_json(f"actions/runs/{run_id}/artifacts?per_page=100&page={page}")
        batch = obj.get("artifacts", []) if isinstance(obj, dict) else []
        if not batch:
            break
        out.extend(batch)
        if len(batch) < 100:
            break
        page += 1
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--shard", type=int, required=True)
    ap.add_argument("--shards", type=int, required=True)
    ap.add_argument("--out", type=Path, required=True)
    args = ap.parse_args()

    s = Scanner(args.out)
    try:
        runs = list_pre_audit_runs()
    except Exception as exc:
        s.status("runs_enumeration_failed", "actions/runs", type(exc).__name__)
        raise

    selected = [run for idx, run in enumerate(runs) if idx % args.shards == args.shard]
    append_jsonl(
        args.out / "coverage.jsonl",
        [{
            "audit_cutoff": CUTOFF,
            "pre_audit_runs_total": len(runs),
            "selected_runs": len(selected),
            "shard": args.shard,
            "shards": args.shards,
        }],
    )

    artifacts_seen = 0
    artifacts_scanned = 0
    artifacts_expired = 0
    artifacts_unavailable = 0

    for run in selected:
        run_id = int(run.get("id", 0) or 0)
        if not run_id:
            continue
        try:
            artifacts = run_artifacts(run_id)
        except Exception as exc:
            s.status("run_artifacts_unavailable", f"run:{run_id}", type(exc).__name__)
            continue
        for art in artifacts:
            artifacts_seen += 1
            art_id = int(art.get("id", 0) or 0)
            if not art_id:
                continue
            created = str(art.get("created_at", ""))
            if created and created > CUTOFF:
                continue
            if art.get("expired"):
                artifacts_expired += 1
                s.status("artifact_expired", f"run:{run_id}/artifact:{art_id}")
                continue
            try:
                raw = api_bytes(f"actions/artifacts/{art_id}/zip")
                artifacts_scanned += 1
            except Exception as exc:
                artifacts_unavailable += 1
                s.status("artifact_download_unavailable", f"run:{run_id}/artifact:{art_id}", type(exc).__name__)
                continue

            location = f"run:{run_id}/artifact:{art_id}"
            try:
                with zipfile.ZipFile(io.BytesIO(raw)) as zf:
                    members = [zi for zi in zf.infolist() if not zi.is_dir()]
                    s.inventory(source="actions:artifact", location=location, kind="artifact", members=len(members))
                    for zi in members:
                        if zi.file_size > 100 * 1024 * 1024:
                            s.status("artifact_member_too_large", f"{location}!{zi.filename}", str(zi.file_size))
                            continue
                        try:
                            data = zf.read(zi)
                        except Exception as exc:
                            s.status("artifact_member_read_failed", f"{location}!{zi.filename}", type(exc).__name__)
                            continue
                        s.scan_bytes(data, source="actions:artifact", location=f"{location}!{zi.filename}")
            except Exception as exc:
                s.status("artifact_zip_failed", location, type(exc).__name__)

    summary = {
        "mode": "actions-artifacts-per-run",
        "audit_cutoff": CUTOFF,
        "shard": args.shard,
        "shards": args.shards,
        "pre_audit_runs_total": len(runs),
        "selected_runs": len(selected),
        "artifacts_seen": artifacts_seen,
        "artifacts_scanned": artifacts_scanned,
        "artifacts_expired": artifacts_expired,
        "artifacts_unavailable": artifacts_unavailable,
        "finding_counts": dict(s.counts),
        "matched_values_emitted": False,
    }
    (args.out / "summary.json").write_text(json.dumps(summary, indent=2, sort_keys=True), encoding="utf-8")
    print(json.dumps(summary, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
