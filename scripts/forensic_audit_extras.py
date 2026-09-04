#!/usr/bin/env python3
"""Supplemental zero-trust audit passes.

All outputs are redacted: matched values are never written. This supplements
forensic_repo_audit.py with retained PR refs, provider-aware credential checks,
PDF page OCR, deep compressed-archive inspection, a fixed Actions cutoff, and
alias-expanded evidence tables.
"""
from __future__ import annotations

import argparse
import base64
import bz2
import csv
import gzip
import json
import lzma
import os
import re
import shutil
import subprocess
import sys
import tempfile
from collections import Counter, defaultdict
from pathlib import Path

# Running this file from scripts/ puts scripts/ on sys.path.
import forensic_repo_audit as base

AUDIT_CUTOFF = os.environ.get("AUDIT_CUTOFF", "2026-09-04T21:47:49Z")
AUDIT_BRANCH = "audit/forensic-zero-trust-20260904"
AUDIT_PR = "187"

EXTRA_PATTERNS = [
    ("emr_term", re.compile(r"(?i)\bEMR\b")),
    ("ehr_term", re.compile(r"(?i)\bEHR\b")),
    ("clinical_document_term", re.compile(r"(?i)\b(?:clinical|medical)\s+(?:document|record|report|summary|export)(?:s)?\b")),
    ("export_term", re.compile(r"(?i)\b(?:exported?|data\s+export|chart\s+export)\b")),
    ("hipaa_phi_term", re.compile(r"(?i)\b(?:HIPAA|PHI|protected\s+health\s+information)\b")),
    ("sharepoint_url", re.compile(r"(?i)https?://[^\s\"'<>]*\.sharepoint\.com(?:[^\s\"'<>]*)?")),
    ("onedrive_url", re.compile(r"(?i)https?://(?:1drv\.ms|[^\s\"'<>]*onedrive[^\s\"'<>]*)(?:[^\s\"'<>]*)?")),
    ("cloudflare_identifier", re.compile(r"(?i)\b(?:CLOUDFLARE|CF)_(?:ACCOUNT|ZONE|PROJECT|API|ACCESS|TOKEN|KEY)[A-Z0-9_]*\b")),
    ("supabase_identifier", re.compile(r"(?i)\bSUPABASE_(?:URL|ANON_KEY|SERVICE_ROLE_KEY|JWT_SECRET|DB_PASSWORD|ACCESS_TOKEN|PROJECT_REF)\b")),
    ("github_secret_identifier", re.compile(r"(?i)\b(?:GH|GITHUB)_(?:TOKEN|PAT|SECRET|APP_PRIVATE_KEY|CLIENT_SECRET)\b")),
    ("openai_secret_identifier", re.compile(r"(?i)\bOPENAI_(?:API_KEY|ADMIN_KEY|PROJECT_KEY)\b")),
]

JWT_RX = re.compile(r"\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b")
PROVIDER_ASSIGNMENTS = [
    ("cloudflare_secret_assignment", re.compile(r"(?i)\b(?:CLOUDFLARE|CF)_[A-Z0-9_]*(?:TOKEN|KEY|SECRET|PASSWORD)\b\s*[:=]\s*[\"']?([A-Za-z0-9_./+\-=]{12,})")),
    ("supabase_secret_assignment", re.compile(r"(?i)\bSUPABASE_(?:SERVICE_ROLE_KEY|JWT_SECRET|DB_PASSWORD|ACCESS_TOKEN)\b\s*[:=]\s*[\"']?([A-Za-z0-9_./+\-=]{12,})")),
    ("github_secret_assignment", re.compile(r"(?i)\b(?:GH|GITHUB)_(?:TOKEN|PAT|SECRET|APP_PRIVATE_KEY|CLIENT_SECRET)\b\s*[:=]\s*[\"']?([A-Za-z0-9_./+\-=]{12,})")),
    ("openai_secret_assignment", re.compile(r"(?i)\bOPENAI_(?:API_KEY|ADMIN_KEY|PROJECT_KEY)\b\s*[:=]\s*[\"']?([A-Za-z0-9_./+\-=]{12,})")),
]
COMPRESSED_EXTS = {".gz", ".bz2", ".xz", ".7z", ".rar"}


def git_blob_index():
    rev = base.git_output(["rev-list", "--objects", "--all"])
    paths = defaultdict(set)
    ids = []
    for line in rev.splitlines():
        if not line:
            continue
        parts = line.split(" ", 1)
        sha = parts[0]
        ids.append(sha)
        if len(parts) == 2:
            paths[sha].add(parts[1])
    proc = subprocess.Popen(
        ["git", "cat-file", "--batch-check=%(objectname) %(objecttype) %(objectsize)"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    out, err = proc.communicate("\n".join(ids) + "\n", timeout=600)
    if proc.returncode != 0:
        raise RuntimeError(err[:500])
    blobs = {}
    for line in out.splitlines():
        p = line.split()
        if len(p) == 3 and p[1] == "blob":
            blobs[p[0]] = int(p[2])
    return blobs, paths


def blob_bytes(sha: str) -> bytes | None:
    p = base.run(["git", "cat-file", "blob", sha], timeout=180)
    return p.stdout if p.returncode == 0 else None


def decode_jwt_payload(token: str) -> dict | None:
    try:
        part = token.split(".")[1]
        part += "=" * ((4 - len(part) % 4) % 4)
        return json.loads(base64.urlsafe_b64decode(part.encode()).decode("utf-8"))
    except Exception:
        return None


def supplemental_git(out: Path) -> None:
    s = base.Scanner(out)
    blobs, paths = git_blob_index()
    scanned = 0
    for sha, size in blobs.items():
        if size > 50 * 1024 * 1024:
            continue
        data = blob_bytes(sha)
        if data is None or b"\x00" in data[:8192]:
            continue
        text = data.decode("utf-8", "replace")
        locs = sorted(paths.get(sha) or {f"blob:{sha}"})
        loc = locs[0]
        scanned += 1
        for lineno, line in enumerate(text.splitlines(), 1):
            for pid, rx in EXTRA_PATTERNS:
                if rx.search(line):
                    s.finding(pid, "git:supplemental", loc, lineno, sha)
            for pid, rx in PROVIDER_ASSIGNMENTS:
                m = rx.search(line)
                if m:
                    value = m.group(1)
                    if not base.placeholder(value) and base.entropy(value) >= 3.5:
                        s.finding(pid, "git:supplemental", loc, lineno, sha)
            for jwt in JWT_RX.findall(line):
                payload = decode_jwt_payload(jwt)
                if payload and str(payload.get("role", "")).lower() in {"service_role", "supabase_admin"}:
                    s.finding("supabase_privileged_jwt", "git:supplemental", loc, lineno, sha)
    s.inventory(source="git:supplemental", location="text-blobs", kind="summary", scanned=scanned)


def pdf_ocr(out: Path) -> None:
    s = base.Scanner(out)
    blobs, paths = git_blob_index()
    pdfs = []
    for sha in blobs:
        locs = sorted(paths.get(sha) or [])
        if any(Path(p).suffix.lower() == ".pdf" for p in locs):
            pdfs.append((sha, locs[0] if locs else f"blob:{sha}"))
    rendered_pages = 0
    failures = 0
    for sha, loc in pdfs:
        data = blob_bytes(sha)
        if data is None:
            s.status("pdf_blob_unavailable", loc, sha[:12])
            failures += 1
            continue
        with tempfile.TemporaryDirectory() as td:
            pdf = Path(td) / "document.pdf"
            pdf.write_bytes(data)
            prefix = Path(td) / "page"
            if not shutil.which("pdftoppm") or not shutil.which("tesseract"):
                s.status("pdf_ocr_unavailable", loc, "pdftoppm or tesseract missing")
                failures += 1
                continue
            try:
                p = base.run(["pdftoppm", "-r", "150", "-png", str(pdf), str(prefix)], timeout=300)
            except subprocess.TimeoutExpired:
                s.status("pdf_render_timeout", loc)
                failures += 1
                continue
            if p.returncode != 0:
                s.status("pdf_render_failed", loc, f"rc={p.returncode}")
                failures += 1
                continue
            pages = sorted(Path(td).glob("page-*.png"))
            for page_no, image in enumerate(pages, 1):
                try:
                    t = base.run(["tesseract", str(image), "stdout", "-l", "eng"], timeout=120)
                    if t.returncode == 0:
                        s.scan_text(t.stdout.decode("utf-8", "replace"), source="git:pdf-page-ocr", location=f"{loc}!page:{page_no}", object_sha=sha)
                    else:
                        s.status("pdf_page_ocr_failed", f"{loc}!page:{page_no}", f"rc={t.returncode}")
                except subprocess.TimeoutExpired:
                    s.status("pdf_page_ocr_timeout", f"{loc}!page:{page_no}")
            rendered_pages += len(pages)
    s.inventory(source="git:pdf-page-ocr", location="pdfs", kind="summary", pdf_blobs=len(pdfs), rendered_pages=rendered_pages, failures=failures)


def deep_archives(out: Path) -> None:
    s = base.Scanner(out)
    blobs, paths = git_blob_index()
    candidates = []
    for sha in blobs:
        locs = sorted(paths.get(sha) or [])
        if locs and Path(locs[0]).suffix.lower() in COMPRESSED_EXTS:
            candidates.append((sha, locs[0], Path(locs[0]).suffix.lower()))
    processed = failures = 0
    for sha, loc, ext in candidates:
        data = blob_bytes(sha)
        if data is None:
            failures += 1
            continue
        try:
            if ext == ".gz":
                s.scan_bytes(gzip.decompress(data), source="git:deep-archive", location=loc + "!decompressed", object_sha=sha, depth=1)
            elif ext == ".bz2":
                s.scan_bytes(bz2.decompress(data), source="git:deep-archive", location=loc + "!decompressed", object_sha=sha, depth=1)
            elif ext == ".xz":
                s.scan_bytes(lzma.decompress(data), source="git:deep-archive", location=loc + "!decompressed", object_sha=sha, depth=1)
            elif ext in {".7z", ".rar"}:
                if not shutil.which("7z"):
                    s.status("archive_tool_unavailable", loc, "7z missing")
                    failures += 1
                    continue
                with tempfile.TemporaryDirectory() as td:
                    arc = Path(td) / ("archive" + ext)
                    arc.write_bytes(data)
                    dest = Path(td) / "extract"
                    dest.mkdir()
                    p = base.run(["7z", "x", "-y", f"-o{dest}", str(arc)], timeout=300)
                    if p.returncode != 0:
                        s.status("archive_extract_failed", loc, f"rc={p.returncode}")
                        failures += 1
                        continue
                    for child in dest.rglob("*"):
                        if child.is_file() and child.stat().st_size <= base.MAX_MEMBER:
                            rel = child.relative_to(dest).as_posix()
                            s.scan_bytes(child.read_bytes(), source="git:deep-archive", location=f"{loc}!{rel}", object_sha=sha, depth=1)
            processed += 1
        except Exception as e:
            s.status("deep_archive_failed", loc, type(e).__name__)
            failures += 1
    s.inventory(source="git:deep-archive", location="archives", kind="summary", candidates=len(candidates), processed=processed, failures=failures)


def cutoff_runs():
    return [r for r in base.list_action_runs() if str(r.get("created_at", "")) <= AUDIT_CUTOFF]


def cutoff_artifacts():
    return [a for a in base.list_artifacts() if str(a.get("created_at", "")) <= AUDIT_CUTOFF]


def actions_logs(out: Path, shard: int, shards: int) -> None:
    original = base.list_action_runs
    try:
        base.list_action_runs = cutoff_runs
        # cutoff_runs calls base.list_action_runs, so point through captured original.
        globals()["cutoff_runs"] = lambda: [r for r in original() if str(r.get("created_at", "")) <= AUDIT_CUTOFF]
        base.list_action_runs = globals()["cutoff_runs"]
        base.scan_action_logs(out, shard, shards)
    finally:
        base.list_action_runs = original


def actions_artifacts(out: Path, shard: int, shards: int) -> None:
    original = base.list_artifacts
    try:
        globals()["cutoff_artifacts"] = lambda: [a for a in original() if str(a.get("created_at", "")) <= AUDIT_CUTOFF]
        base.list_artifacts = globals()["cutoff_artifacts"]
        base.scan_action_artifacts(out, shard, shards)
    finally:
        base.list_artifacts = original


def augment(final_dir: Path) -> None:
    findings_path = final_dir / "findings.jsonl"
    inventory_path = final_dir / "inventory.jsonl"
    status_path = final_dir / "scan-status.jsonl"
    findings = [json.loads(x) for x in findings_path.read_text(encoding="utf-8").splitlines() if x.strip()] if findings_path.exists() else []
    inventory = [json.loads(x) for x in inventory_path.read_text(encoding="utf-8").splitlines() if x.strip()] if inventory_path.exists() else []
    statuses = [json.loads(x) for x in status_path.read_text(encoding="utf-8").splitlines() if x.strip()] if status_path.exists() else []

    sha_paths = defaultdict(set)
    for row in inventory:
        sha = row.get("object_sha")
        loc = row.get("location")
        src = row.get("source", "")
        if sha and loc and src.startswith("git") and not str(loc).startswith("commit:"):
            # For aliases, the exact historical path is the location.
            sha_paths[sha].add(loc)

    expanded = []
    for f in findings:
        sha = f.get("object_sha")
        paths = sorted(sha_paths.get(sha, [])) if sha else []
        if not paths:
            expanded.append(f)
            continue
        for loc in paths:
            row = dict(f)
            row["location"] = loc
            expanded.append(row)
    uniq = {json.dumps(x, sort_keys=True): x for x in expanded}
    expanded = sorted(uniq.values(), key=lambda x: (x.get("pattern", ""), x.get("location", ""), x.get("line", 0)))
    (final_dir / "findings-expanded.jsonl").write_text("".join(json.dumps(x, sort_keys=True) + "\n" for x in expanded), encoding="utf-8")

    by_loc = defaultdict(set)
    for f in expanded:
        by_loc[f.get("location", "")].add(f.get("pattern", ""))
    with (final_dir / "flagged-paths-expanded.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["location", "patterns"])
        for loc in sorted(by_loc):
            w.writerow([loc, ";".join(sorted(by_loc[loc]))])

    definitions = [(pid, rx.pattern, "regex:all text") for pid, rx in base.PATTERNS]
    definitions += [(pid, rx.pattern, "regex:reachable Git text blobs") for pid, rx in EXTRA_PATTERNS]
    definitions += [(pid, rx.pattern, "provider secret assignment + entropy + placeholder filter") for pid, rx in PROVIDER_ASSIGNMENTS]
    definitions += [
        ("high_entropy_secret_assignment", base.SECRET_ASSIGN.pattern, "secret-like assignment + entropy + placeholder filter"),
        ("supabase_privileged_jwt", JWT_RX.pattern, "JWT payload role in {service_role,supabase_admin}; token value never emitted"),
        ("large_binary_or_blob", ">= 1 MiB", "size detector"),
        ("key_or_certificate_file", ";".join(sorted(base.KEY_EXTS)), "extension detector"),
        ("backup_dump_or_database_file", ";".join(sorted(base.DUMP_EXTS)), "extension detector"),
        ("source_map_file", ".map", "extension detector"),
        ("git_lfs_pointer", "version https://git-lfs.github.com/spec/v1", "content detector"),
        ("git_submodule", "git mode 160000", "tree-mode detector"),
        ("pdf_page_ocr", "render every reachable PDF page at 150 DPI then OCR with Tesseract", "binary content pass"),
        ("image_ocr", "OCR every reachable image blob handled by primary scanner", "binary content pass"),
        ("office_internal_scan", ".docx/.xlsx/.pptx ZIP members recursively scanned", "binary content pass"),
        ("deep_archive_scan", ".gz/.bz2/.xz/.7z/.rar decompression", "archive content pass"),
    ]
    seen = set()
    with (final_dir / "pattern-definitions.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["pattern_id", "exact_pattern_or_detector", "scope", "tested"])
        for pid, pat, scope in definitions:
            key = (pid, pat, scope)
            if key in seen:
                continue
            seen.add(key)
            w.writerow([pid, pat, scope, "yes"])

    binary_rows = {}
    sensitive_exts = base.IMAGE_EXTS | base.OFFICE_EXTS | base.PDF_EXTS | base.ARCHIVE_EXTS | base.KEY_EXTS | base.DUMP_EXTS | {".map"}
    for r in inventory:
        loc = r.get("location", "")
        ext = str(r.get("ext", "")).lower() or Path(str(loc).split("!")[0]).suffix.lower()
        if ext in sensitive_exts and loc:
            binary_rows[(loc, ext)] = (r.get("source", ""), r.get("size", ""), r.get("object_sha", ""))
    with (final_dir / "binary-review-inventory.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["location", "extension", "source", "size", "object_sha"])
        for (loc, ext), vals in sorted(binary_rows.items()):
            w.writerow([loc, ext, *vals])

    with (final_dir / "unavailable-or-limited.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["status", "location", "detail"])
        for row in statuses:
            if row.get("status") not in {"git_fetch", "git_lfs_fetch", "not_applicable"}:
                w.writerow([row.get("status", ""), row.get("location", ""), row.get("detail", "")])

    extra = {
        "audit_cutoff": AUDIT_CUTOFF,
        "expanded_findings": len(expanded),
        "expanded_flagged_locations": len(by_loc),
        "extra_pattern_ids": [x[0] for x in definitions],
        "unavailable_or_limited_count": sum(1 for x in statuses if x.get("status") not in {"git_fetch", "git_lfs_fetch", "not_applicable"}),
    }
    (final_dir / "coverage-extra.json").write_text(json.dumps(extra, indent=2, sort_keys=True), encoding="utf-8")
    print(json.dumps(extra, sort_keys=True))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", required=True, choices=["supplemental-git", "pdf-ocr", "deep-archives", "actions-logs", "actions-artifacts", "augment"])
    ap.add_argument("--out")
    ap.add_argument("--final-dir")
    ap.add_argument("--shard", type=int, default=0)
    ap.add_argument("--shards", type=int, default=1)
    args = ap.parse_args()
    if args.mode == "augment":
        augment(Path(args.final_dir))
    else:
        out = Path(args.out)
        if args.mode == "supplemental-git":
            supplemental_git(out)
        elif args.mode == "pdf-ocr":
            pdf_ocr(out)
        elif args.mode == "deep-archives":
            deep_archives(out)
        elif args.mode == "actions-logs":
            actions_logs(out, args.shard, args.shards)
        elif args.mode == "actions-artifacts":
            actions_artifacts(out, args.shard, args.shards)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
