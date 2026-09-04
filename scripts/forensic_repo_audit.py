#!/usr/bin/env python3
"""Redacted forensic scanner for this public repository.

The scanner never emits matched values. Reports contain only pattern IDs,
locations, object/run identifiers, line numbers, sizes, and scan status.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import math
import mimetypes
import os
import re
import shutil
import subprocess
import sys
import tarfile
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

REPO = os.environ.get("GITHUB_REPOSITORY", "stevetodman/stevetodman.com")
TOKEN = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN") or ""
UA = "stevetodman-forensic-audit/1.0"
MAX_DOWNLOAD = 250 * 1024 * 1024
MAX_MEMBER = 100 * 1024 * 1024
TEXT_EXTS = {
    ".txt", ".md", ".markdown", ".html", ".htm", ".css", ".js", ".mjs", ".cjs",
    ".ts", ".tsx", ".jsx", ".json", ".jsonl", ".yaml", ".yml", ".toml", ".ini",
    ".cfg", ".conf", ".xml", ".svg", ".csv", ".tsv", ".sql", ".sh", ".bash",
    ".zsh", ".ps1", ".py", ".rb", ".go", ".rs", ".java", ".kt", ".swift",
    ".properties", ".env", ".map", ".lock", ".log", ".tex", ".rst", ".gitignore",
    ".gitattributes", ".dockerignore",
}
IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".tif", ".tiff"}
OFFICE_EXTS = {".docx", ".xlsx", ".pptx"}
PDF_EXTS = {".pdf"}
ARCHIVE_EXTS = {".zip", ".tar", ".tgz", ".gz", ".bz2", ".xz", ".7z", ".rar"}
KEY_EXTS = {".pem", ".key", ".pfx", ".p12", ".crt", ".cer", ".der", ".jks", ".keystore"}
DUMP_EXTS = {".bak", ".backup", ".dump", ".dmp", ".sql", ".sqlite", ".sqlite3", ".db"}

PATTERNS = [
    ("email_address", re.compile(r"(?i)\b[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}\b")),
    ("phone_number", re.compile(r"(?<!\d)(?:\+?1[\s.\-]?)?(?:\(?[2-9]\d{2}\)?[\s.\-]?)?[2-9]\d{2}[\s.\-]\d{4}(?!\d)")),
    ("physical_address", re.compile(r"(?i)\b\d{1,6}\s+[A-Za-z0-9.'#\- ]{2,60}\s(?:Street|St\.?|Road|Rd\.?|Avenue|Ave\.?|Boulevard|Blvd\.?|Drive|Dr\.?|Lane|Ln\.?|Court|Ct\.?|Way|Highway|Hwy\.?|Parkway|Pkwy\.?|Place|Pl\.?)\b")),
    ("mrn", re.compile(r"(?i)\b(?:MRN|medical\s+record\s+(?:number|no\.?))\b")),
    ("dob", re.compile(r"(?i)\b(?:DOB|date\s+of\s+birth)\b")),
    ("patient", re.compile(r"(?i)\bpatient(?:s)?\b")),
    ("diagnosis", re.compile(r"(?i)\bdiagnos(?:is|es|tic)\b")),
    ("clinical_note", re.compile(r"(?i)\bclinical\s+note(?:s)?\b")),
    ("echo", re.compile(r"(?i)\b(?:echo|echocardiogram|echocardiography)\b")),
    ("ecg", re.compile(r"(?i)\bECG\b")),
    ("ekg", re.compile(r"(?i)\bEKG\b")),
    ("billing", re.compile(r"(?i)\bbilling\b")),
    ("invoice", re.compile(r"(?i)\binvoice(?:s)?\b")),
    ("insurance", re.compile(r"(?i)\binsurance\b")),
    ("credential", re.compile(r"(?i)\bcredential(?:s)?\b")),
    ("password", re.compile(r"(?i)\bpassword(?:s)?\b")),
    ("secret", re.compile(r"(?i)\bsecret(?:s)?\b")),
    ("token", re.compile(r"(?i)\btoken(?:s)?\b")),
    ("bearer", re.compile(r"(?i)\bbearer\b")),
    ("api_key_term", re.compile(r"(?i)\bAPI[ _-]?key\b")),
    ("private_key_term", re.compile(r"(?i)\bprivate[ _-]?key\b")),
    ("pem_term", re.compile(r"(?i)\bPEM\b")),
    ("pfx_term", re.compile(r"(?i)\bPFX\b")),
    ("p12_term", re.compile(r"(?i)\bP12\b")),
    ("env_term", re.compile(r"(?i)(?:\bENV\b|\.env(?:\.|\b))")),
    ("supabase", re.compile(r"(?i)\bSupabase\b")),
    ("cloudflare", re.compile(r"(?i)\bCloudflare\b")),
    ("github_token_term", re.compile(r"(?i)\bGitHub[ _-]?token\b")),
    ("openai_key_term", re.compile(r"(?i)\bOpenAI[ _-]?(?:API[ _-]?)?key\b")),
    ("sharepoint", re.compile(r"(?i)(?:\bSharePoint\b|https?://[^\s\"'<>]*\.sharepoint\.com\b)")),
    ("onedrive", re.compile(r"(?i)(?:\bOneDrive\b|https?://(?:1drv\.ms|[^\s\"'<>]*onedrive[^\s\"'<>]*))")),
    ("internal_url", re.compile(r"(?i)https?://(?:localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|[^/\s\"'<>]+\.(?:internal|local))(?:[^\s\"'<>]*)?")),
    ("tenant_identifier", re.compile(r"(?i)\btenant(?:[ _-]?id)?\b\s*[:=]\s*[\"']?[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b")),
    ("github_pat", re.compile(r"\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b")),
    ("openai_api_key", re.compile(r"\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b")),
    ("aws_access_key", re.compile(r"\b(?:AKIA|ASIA)[0-9A-Z]{16}\b")),
    ("google_api_key", re.compile(r"\bAIza[0-9A-Za-z_-]{35}\b")),
    ("slack_token", re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{10,}\b")),
    ("private_key_header", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----")),
    ("certificate_header", re.compile(r"-----BEGIN CERTIFICATE-----")),
    ("jwt_candidate", re.compile(r"\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b")),
]
SECRET_ASSIGN = re.compile(
    r"(?i)\b(?:secret|token|password|passwd|pwd|api[_ -]?key|client[_ -]?secret|service[_ -]?role|authorization)\b[^\n:=]{0,40}[:=]\s*[\"']?([A-Za-z0-9_./+\-=]{12,})"
)
ATTACHMENT_RE = re.compile(r"https://(?:github\.com/user-attachments/assets/[A-Za-z0-9\-]+|user-images\.githubusercontent\.com/[^\s)\]>'\"]+)")


def entropy(s: str) -> float:
    if not s:
        return 0.0
    c = Counter(s)
    n = len(s)
    return -sum((v / n) * math.log2(v / n) for v in c.values())


def placeholder(value: str) -> bool:
    v = value.lower()
    return any(x in v for x in ("example", "placeholder", "changeme", "your_", "your-", "dummy", "test", "fake", "redacted", "xxxx", "${{", "process.env", "os.environ"))


def append_jsonl(path: Path, rows: list[dict]) -> None:
    if not rows:
        path.touch(exist_ok=True)
        return
    with path.open("a", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, sort_keys=True, ensure_ascii=True) + "\n")


def run(args: list[str], *, input_bytes: bytes | None = None, cwd: str | None = None, timeout: int = 120) -> subprocess.CompletedProcess:
    return subprocess.run(args, input=input_bytes, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout, check=False)


def api_get(path_or_url: str, *, binary: bool = False, timeout: int = 60) -> bytes:
    url = path_or_url if path_or_url.startswith("http") else f"https://api.github.com/repos/{REPO}/{path_or_url.lstrip('/')}"
    headers = {"User-Agent": UA, "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        data = resp.read(MAX_DOWNLOAD + 1)
        if len(data) > MAX_DOWNLOAD:
            raise ValueError(f"download exceeds {MAX_DOWNLOAD} bytes")
        return data


def api_json(path: str) -> object:
    return json.loads(api_get(path).decode("utf-8"))


def paginate(path: str):
    page = 1
    join = "&" if "?" in path else "?"
    while True:
        obj = api_json(f"{path}{join}per_page=100&page={page}")
        if not isinstance(obj, list) or not obj:
            return
        for item in obj:
            yield item
        if len(obj) < 100:
            return
        page += 1


class Scanner:
    def __init__(self, out: Path):
        self.out = out
        self.out.mkdir(parents=True, exist_ok=True)
        self.findings_path = self.out / "findings.jsonl"
        self.status_path = self.out / "scan-status.jsonl"
        self.inventory_path = self.out / "inventory.jsonl"
        self.counts = Counter()

    def status(self, status: str, location: str, detail: str = "") -> None:
        append_jsonl(self.status_path, [{"status": status, "location": location, "detail": detail[:300]}])

    def inventory(self, **row) -> None:
        append_jsonl(self.inventory_path, [row])

    def finding(self, pattern: str, source: str, location: str, line: int | None = None, object_sha: str = "", note: str = "") -> None:
        self.counts[pattern] += 1
        row = {"pattern": pattern, "source": source, "location": location}
        if line is not None:
            row["line"] = line
        if object_sha:
            row["object_sha"] = object_sha
        if note:
            row["note"] = note[:300]
        append_jsonl(self.findings_path, [row])

    def scan_text(self, text: str, *, source: str, location: str, object_sha: str = "") -> None:
        for lineno, line in enumerate(text.splitlines(), 1):
            for pid, rx in PATTERNS:
                if rx.search(line):
                    self.finding(pid, source, location, lineno, object_sha)
            m = SECRET_ASSIGN.search(line)
            if m:
                candidate = m.group(1)
                if not placeholder(candidate) and entropy(candidate) >= 3.5:
                    self.finding("high_entropy_secret_assignment", source, location, lineno, object_sha)

    def scan_image(self, path: Path, *, source: str, location: str, object_sha: str = "") -> None:
        if shutil.which("exiftool"):
            p = run(["exiftool", "-a", "-u", "-g1", str(path)], timeout=45)
            self.scan_text(p.stdout.decode("utf-8", "replace"), source=source + ":metadata", location=location, object_sha=object_sha)
        else:
            self.status("unavailable", location, "exiftool not installed")
        if shutil.which("tesseract"):
            try:
                p = run(["tesseract", str(path), "stdout", "-l", "eng"], timeout=60)
                if p.returncode == 0:
                    self.scan_text(p.stdout.decode("utf-8", "replace"), source=source + ":ocr", location=location, object_sha=object_sha)
                else:
                    self.status("ocr_failed", location, f"tesseract rc={p.returncode}")
            except subprocess.TimeoutExpired:
                self.status("ocr_timeout", location)
        else:
            self.status("unavailable", location, "tesseract not installed")

    def scan_pdf(self, path: Path, *, source: str, location: str, object_sha: str = "") -> None:
        for tool, args, suffix in (
            ("pdfinfo", ["pdfinfo", str(path)], "metadata"),
            ("pdftotext", ["pdftotext", "-layout", str(path), "-"], "text"),
        ):
            if not shutil.which(tool):
                self.status("unavailable", location, f"{tool} not installed")
                continue
            try:
                p = run(args, timeout=90)
                self.scan_text(p.stdout.decode("utf-8", "replace"), source=source + ":" + suffix, location=location, object_sha=object_sha)
                if p.returncode != 0:
                    self.status("extract_failed", location, f"{tool} rc={p.returncode}")
            except subprocess.TimeoutExpired:
                self.status("extract_timeout", location, tool)

    def scan_zip(self, path: Path, *, source: str, location: str, object_sha: str = "", depth: int = 0) -> None:
        try:
            with zipfile.ZipFile(path) as z:
                infos = z.infolist()
                self.inventory(source=source, location=location, kind="zip", members=len(infos), object_sha=object_sha)
                for info in infos:
                    inner = f"{location}!{info.filename}"
                    if info.is_dir():
                        continue
                    if info.file_size > MAX_MEMBER:
                        self.status("member_too_large", inner, str(info.file_size))
                        continue
                    try:
                        data = z.read(info)
                    except Exception as e:
                        self.status("member_read_failed", inner, type(e).__name__)
                        continue
                    self.scan_bytes(data, source=source + ":archive", location=inner, object_sha=object_sha, depth=depth + 1)
        except Exception as e:
            self.status("zip_failed", location, type(e).__name__)

    def scan_tar(self, path: Path, *, source: str, location: str, object_sha: str = "", depth: int = 0) -> None:
        try:
            with tarfile.open(path, "r:*") as tf:
                members = [m for m in tf.getmembers() if m.isfile()]
                self.inventory(source=source, location=location, kind="tar", members=len(members), object_sha=object_sha)
                for m in members:
                    inner = f"{location}!{m.name}"
                    if m.size > MAX_MEMBER:
                        self.status("member_too_large", inner, str(m.size))
                        continue
                    f = tf.extractfile(m)
                    if not f:
                        continue
                    self.scan_bytes(f.read(), source=source + ":archive", location=inner, object_sha=object_sha, depth=depth + 1)
        except Exception as e:
            self.status("tar_failed", location, type(e).__name__)

    def scan_bytes(self, data: bytes, *, source: str, location: str, object_sha: str = "", depth: int = 0) -> None:
        ext = Path(location.split("!")[-1].split("?")[0]).suffix.lower()
        self.inventory(source=source, location=location, kind="file", size=len(data), ext=ext, object_sha=object_sha)
        if len(data) >= 1024 * 1024:
            self.finding("large_binary_or_blob", source, location, object_sha=object_sha, note=str(len(data)))
        if ext in KEY_EXTS:
            self.finding("key_or_certificate_file", source, location, object_sha=object_sha)
        if ext in DUMP_EXTS:
            self.finding("backup_dump_or_database_file", source, location, object_sha=object_sha)
        if ext in {".map"}:
            self.finding("source_map_file", source, location, object_sha=object_sha)

        lfs = re.search(rb"oid sha256:([0-9a-f]{64})", data[:1024]) if data.startswith(b"version https://git-lfs.github.com/spec/v1") else None
        if lfs:
            oid = lfs.group(1).decode()
            self.finding("git_lfs_pointer", source, location, object_sha=object_sha, note=oid[:12])
            lfs_path = Path(".git/lfs/objects") / oid[:2] / oid[2:4] / oid
            if lfs_path.exists():
                self.scan_bytes(lfs_path.read_bytes(), source=source + ":lfs", location=location + "!LFS", object_sha=object_sha, depth=depth + 1)
            else:
                self.status("lfs_object_unavailable", location, oid[:12])
            return

        textual = ext in TEXT_EXTS or (b"\x00" not in data[:8192] and len(data) <= 50 * 1024 * 1024)
        if textual:
            self.scan_text(data.decode("utf-8", "replace"), source=source, location=location, object_sha=object_sha)

        if depth > 3:
            return
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / (Path(location.split("!")[-1]).name or "blob")
            try:
                p.write_bytes(data)
            except OSError:
                return
            if ext in PDF_EXTS:
                self.scan_pdf(p, source=source, location=location, object_sha=object_sha)
            elif ext in OFFICE_EXTS or ext == ".zip":
                self.scan_zip(p, source=source, location=location, object_sha=object_sha, depth=depth)
            elif ext in {".tar", ".tgz", ".gz", ".bz2", ".xz"}:
                self.scan_tar(p, source=source, location=location, object_sha=object_sha, depth=depth)
            elif ext in IMAGE_EXTS:
                self.scan_image(p, source=source, location=location, object_sha=object_sha)
            elif not textual:
                strings = b"\n".join(re.findall(rb"[\x20-\x7e]{8,}", data))
                if strings:
                    self.scan_text(strings.decode("ascii", "replace"), source=source + ":strings", location=location, object_sha=object_sha)


def git_output(args: list[str]) -> str:
    p = run(["git"] + args, timeout=300)
    if p.returncode != 0:
        raise RuntimeError(p.stderr.decode("utf-8", "replace")[:500])
    return p.stdout.decode("utf-8", "replace")


def scan_repo(out: Path) -> None:
    s = Scanner(out)
    # Ensure all server-visible refs are represented locally.
    fetch = run(["git", "fetch", "origin", "+refs/heads/*:refs/remotes/origin/*", "+refs/tags/*:refs/tags/*", "--force", "--prune"], timeout=600)
    s.status("git_fetch", "origin", f"rc={fetch.returncode}")
    lfs_fetch = run(["git", "lfs", "fetch", "--all"], timeout=900) if shutil.which("git-lfs") or run(["git", "lfs", "version"]).returncode == 0 else None
    if lfs_fetch is not None:
        s.status("git_lfs_fetch", "origin", f"rc={lfs_fetch.returncode}")

    branches = [x for x in git_output(["for-each-ref", "--format=%(refname)", "refs/remotes/origin/heads", "refs/remotes/origin"]).splitlines() if x and not x.endswith("/HEAD")]
    # refs/remotes/origin/heads is harmless if absent; refs/remotes/origin captures fetched heads.
    branches = sorted(set(x for x in branches if x.startswith("refs/remotes/origin/") and x != "refs/remotes/origin/HEAD"))
    tags = [x for x in git_output(["for-each-ref", "--format=%(refname)", "refs/tags"]).splitlines() if x]
    commits = [x for x in git_output(["rev-list", "--all"]).splitlines() if x]
    s.inventory(source="git", location="refs", kind="summary", branches=len(branches), tags=len(tags), reachable_commits=len(set(commits)))

    # Scan commit metadata/messages directly, including author/committer emails.
    meta = git_output(["log", "--all", "--format=COMMIT:%H%nAUTHOR_NAME:%an%nAUTHOR_EMAIL:%ae%nCOMMITTER_NAME:%cn%nCOMMITTER_EMAIL:%ce%n%B%n--END--"])
    current_commit = ""
    for block in meta.split("--END--"):
        m = re.search(r"COMMIT:([0-9a-f]{40})", block)
        if m:
            current_commit = m.group(1)
            s.scan_text(block, source="git:commit-metadata", location=f"commit:{current_commit}", object_sha=current_commit)

    # Map all reachable objects to historical paths, deduplicated by blob SHA.
    rev = git_output(["rev-list", "--objects", "--all"])
    paths = defaultdict(set)
    object_ids = []
    for line in rev.splitlines():
        if not line:
            continue
        parts = line.split(" ", 1)
        sha = parts[0]
        object_ids.append(sha)
        if len(parts) == 2:
            paths[sha].add(parts[1])
    proc = subprocess.Popen(["git", "cat-file", "--batch-check=%(objectname) %(objecttype) %(objectsize)"], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    batch_out, batch_err = proc.communicate("\n".join(object_ids) + "\n", timeout=600)
    if proc.returncode != 0:
        s.status("cat_file_batch_failed", "git", batch_err[:300])
        raise RuntimeError("git cat-file batch failed")
    blob_meta = {}
    for line in batch_out.splitlines():
        parts = line.split()
        if len(parts) == 3 and parts[1] == "blob":
            blob_meta[parts[0]] = int(parts[2])
    s.inventory(source="git", location="objects", kind="summary", reachable_objects=len(set(object_ids)), unique_blobs=len(blob_meta))

    for i, (sha, size) in enumerate(blob_meta.items(), 1):
        blob = run(["git", "cat-file", "blob", sha], timeout=180)
        if blob.returncode != 0:
            s.status("blob_read_failed", sha, f"rc={blob.returncode}")
            continue
        locs = sorted(paths.get(sha) or {f"blob:{sha}"})
        # Scan once per unique content; preserve every historical path in inventory/findings by alias note.
        primary = locs[0]
        s.scan_bytes(blob.stdout, source="git:history", location=primary, object_sha=sha)
        if len(locs) > 1:
            for alias in locs[1:]:
                s.inventory(source="git:history-alias", location=alias, kind="alias", object_sha=sha, primary=primary)

    # Exact current-main tracked inventory. Scan aliases even when history content was already scanned.
    current_ref = "refs/remotes/origin/main"
    tree = run(["git", "ls-tree", "-r", "-z", current_ref], timeout=300)
    if tree.returncode != 0:
        s.status("current_tree_failed", current_ref, f"rc={tree.returncode}")
    else:
        current_count = 0
        for rec in tree.stdout.split(b"\x00"):
            if not rec:
                continue
            head, rawpath = rec.split(b"\t", 1)
            mode, typ, sha = head.decode().split()
            path = rawpath.decode("utf-8", "replace")
            current_count += 1
            s.inventory(source="git:current-main", location=path, kind=typ, mode=mode, object_sha=sha)
            if mode == "160000":
                s.finding("git_submodule", "git:current-main", path, object_sha=sha)
        s.inventory(source="git:current-main", location="tree", kind="summary", tracked_entries=current_count)

    summary = {
        "mode": "repo",
        "patterns": [p for p, _ in PATTERNS] + ["high_entropy_secret_assignment", "large_binary_or_blob", "key_or_certificate_file", "backup_dump_or_database_file", "source_map_file", "git_lfs_pointer", "git_submodule"],
        "finding_counts": dict(s.counts),
    }
    (out / "summary.json").write_text(json.dumps(summary, indent=2, sort_keys=True), encoding="utf-8")
    print(json.dumps({"mode": "repo", "finding_count": sum(s.counts.values())}))


def scan_json_text(s: Scanner, obj: object, source: str, location: str) -> list[str]:
    text = json.dumps(obj, ensure_ascii=True)
    s.scan_text(text, source=source, location=location)
    return ATTACHMENT_RE.findall(text)


def scan_download(s: Scanner, url: str, source: str, location: str) -> None:
    try:
        data = api_get(url, binary=True, timeout=120)
        parsed = urllib.parse.urlparse(url)
        name = Path(parsed.path).name or "attachment"
        s.scan_bytes(data, source=source, location=f"{location}!{name}")
    except Exception as e:
        s.status("download_unavailable", location, type(e).__name__)


def scan_surfaces(out: Path) -> None:
    s = Scanner(out)
    attachments = set()
    try:
        repo = api_json("")
        s.inventory(source="github", location="repository", kind="metadata", has_wiki=bool(repo.get("has_wiki")), has_discussions=bool(repo.get("has_discussions")))
    except Exception as e:
        s.status("api_failed", "repository", type(e).__name__)
        repo = {}

    endpoints = [
        ("issues", "issues?state=all"),
        ("issue_comments", "issues/comments?"),
        ("pull_review_comments", "pulls/comments?"),
        ("commit_comments", "comments?"),
        ("releases", "releases?"),
    ]
    pulls = []
    for label, endpoint in endpoints:
        count = 0
        try:
            for item in paginate(endpoint):
                count += 1
                attachments.update(scan_json_text(s, item, "github:" + label, f"{label}:{item.get('id') or item.get('number') or count}"))
                if label == "issues" and item.get("pull_request"):
                    pulls.append(item.get("number"))
                if label == "releases":
                    for asset in item.get("assets", []) or []:
                        url = asset.get("browser_download_url")
                        if url:
                            scan_download(s, url, "github:release-asset", f"release:{item.get('id')}:asset:{asset.get('id')}")
            s.inventory(source="github", location=label, kind="summary", count=count)
        except Exception as e:
            s.status("api_failed", label, type(e).__name__)

    # PR review bodies are separate from review comments.
    review_count = 0
    for pr in pulls:
        try:
            for review in paginate(f"pulls/{pr}/reviews?"):
                review_count += 1
                attachments.update(scan_json_text(s, review, "github:pull-review", f"pr:{pr}:review:{review.get('id')}"))
        except Exception as e:
            s.status("api_failed", f"pr:{pr}:reviews", type(e).__name__)
    s.inventory(source="github", location="pull_reviews", kind="summary", count=review_count)

    # Download and inspect every referenced issue/PR attachment still accessible.
    for idx, url in enumerate(sorted(attachments), 1):
        scan_download(s, url, "github:attachment", f"attachment:{idx}")
    s.inventory(source="github", location="attachments", kind="summary", discovered=len(attachments))

    # Wiki is a separate git repository. Clone it only when enabled.
    if repo.get("has_wiki"):
        with tempfile.TemporaryDirectory() as td:
            wiki = Path(td) / "wiki"
            clone_url = f"https://github.com/{REPO}.wiki.git"
            p = run(["git", "clone", "--mirror", clone_url, str(wiki)], timeout=300)
            if p.returncode == 0:
                rev = run(["git", "--git-dir", str(wiki), "rev-list", "--objects", "--all"], timeout=300)
                count = 0
                for line in rev.stdout.decode("utf-8", "replace").splitlines():
                    parts = line.split(" ", 1)
                    if len(parts) != 2:
                        continue
                    sha, path = parts
                    typ = run(["git", "--git-dir", str(wiki), "cat-file", "-t", sha]).stdout.decode().strip()
                    if typ != "blob":
                        continue
                    data = run(["git", "--git-dir", str(wiki), "cat-file", "blob", sha], timeout=120).stdout
                    s.scan_bytes(data, source="github:wiki-history", location=path, object_sha=sha)
                    count += 1
                s.inventory(source="github", location="wiki", kind="summary", unique_blob_path_records=count)
            else:
                s.status("wiki_unavailable", "wiki", f"clone rc={p.returncode}")
    else:
        s.status("not_applicable", "discussions", "repository has_discussions=false")

    (out / "summary.json").write_text(json.dumps({"mode": "surfaces", "finding_counts": dict(s.counts)}, indent=2, sort_keys=True), encoding="utf-8")
    print(json.dumps({"mode": "surfaces", "finding_count": sum(s.counts.values())}))


def list_action_runs() -> list[dict]:
    runs = []
    page = 1
    while True:
        obj = api_json(f"actions/runs?per_page=100&page={page}")
        batch = obj.get("workflow_runs", []) if isinstance(obj, dict) else []
        if not batch:
            break
        runs.extend(batch)
        if len(batch) < 100:
            break
        page += 1
    return runs


def scan_action_logs(out: Path, shard: int, shards: int) -> None:
    s = Scanner(out)
    runs = list_action_runs()
    selected = [r for i, r in enumerate(runs) if i % shards == shard]
    unavailable = 0
    scanned = 0
    for r in selected:
        rid = r.get("id")
        try:
            data = api_get(f"actions/runs/{rid}/logs", binary=True, timeout=180)
            with tempfile.TemporaryDirectory() as td:
                p = Path(td) / "logs.zip"
                p.write_bytes(data)
                s.scan_zip(p, source="github:actions-log", location=f"actions-run:{rid}:logs")
            scanned += 1
        except Exception as e:
            unavailable += 1
            s.status("actions_log_unavailable", f"actions-run:{rid}", type(e).__name__)
    s.inventory(source="github", location=f"actions-logs-shard-{shard}", kind="summary", total_runs=len(runs), selected=len(selected), scanned=scanned, unavailable=unavailable)
    (out / "summary.json").write_text(json.dumps({"mode": "actions-logs", "shard": shard, "finding_counts": dict(s.counts), "runs": len(runs), "scanned": scanned, "unavailable": unavailable}, indent=2, sort_keys=True), encoding="utf-8")
    print(json.dumps({"mode": "actions-logs", "shard": shard, "runs": len(runs), "scanned": scanned, "unavailable": unavailable, "finding_count": sum(s.counts.values())}))


def list_artifacts() -> list[dict]:
    arts = []
    page = 1
    while True:
        obj = api_json(f"actions/artifacts?per_page=100&page={page}")
        batch = obj.get("artifacts", []) if isinstance(obj, dict) else []
        if not batch:
            break
        arts.extend(batch)
        if len(batch) < 100:
            break
        page += 1
    return arts


def scan_action_artifacts(out: Path, shard: int, shards: int) -> None:
    s = Scanner(out)
    arts = list_artifacts()
    selected = [a for i, a in enumerate(arts) if i % shards == shard]
    expired = unavailable = scanned = 0
    for a in selected:
        aid = a.get("id")
        if a.get("expired"):
            expired += 1
            s.status("artifact_expired", f"artifact:{aid}", str(a.get("name", ""))[:100])
            continue
        try:
            data = api_get(f"actions/artifacts/{aid}/zip", binary=True, timeout=180)
            with tempfile.TemporaryDirectory() as td:
                p = Path(td) / "artifact.zip"
                p.write_bytes(data)
                s.scan_zip(p, source="github:actions-artifact", location=f"artifact:{aid}:{a.get('name','')}")
            scanned += 1
        except Exception as e:
            unavailable += 1
            s.status("artifact_unavailable", f"artifact:{aid}", type(e).__name__)
    s.inventory(source="github", location=f"artifacts-shard-{shard}", kind="summary", total_artifacts=len(arts), selected=len(selected), scanned=scanned, expired=expired, unavailable=unavailable)
    (out / "summary.json").write_text(json.dumps({"mode": "actions-artifacts", "shard": shard, "finding_counts": dict(s.counts), "artifacts": len(arts), "scanned": scanned, "expired": expired, "unavailable": unavailable}, indent=2, sort_keys=True), encoding="utf-8")
    print(json.dumps({"mode": "actions-artifacts", "shard": shard, "artifacts": len(arts), "scanned": scanned, "expired": expired, "unavailable": unavailable, "finding_count": sum(s.counts.values())}))


def collate(root: Path, out: Path) -> None:
    out.mkdir(parents=True, exist_ok=True)
    findings = []
    statuses = []
    inventories = []
    summaries = []
    for p in root.rglob("findings.jsonl"):
        findings.extend(json.loads(x) for x in p.read_text(encoding="utf-8").splitlines() if x.strip())
    for p in root.rglob("scan-status.jsonl"):
        statuses.extend(json.loads(x) for x in p.read_text(encoding="utf-8").splitlines() if x.strip())
    for p in root.rglob("inventory.jsonl"):
        inventories.extend(json.loads(x) for x in p.read_text(encoding="utf-8").splitlines() if x.strip())
    for p in root.rglob("summary.json"):
        try:
            summaries.append(json.loads(p.read_text(encoding="utf-8")))
        except Exception:
            pass

    # Deduplicate exact finding records while retaining every distinct path/location.
    uniq = {}
    for f in findings:
        key = json.dumps(f, sort_keys=True)
        uniq[key] = f
    findings = sorted(uniq.values(), key=lambda x: (x.get("pattern", ""), x.get("location", ""), x.get("line", 0)))
    append_jsonl(out / "findings.jsonl", findings)
    append_jsonl(out / "scan-status.jsonl", statuses)
    append_jsonl(out / "inventory.jsonl", inventories)

    patterns = sorted(set([p for p, _ in PATTERNS] + ["high_entropy_secret_assignment", "large_binary_or_blob", "key_or_certificate_file", "backup_dump_or_database_file", "source_map_file", "git_lfs_pointer", "git_submodule"]))
    with (out / "patterns-tested.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["pattern_id", "tested"])
        for p in patterns:
            w.writerow([p, "yes"])

    by_pattern = Counter(x.get("pattern") for x in findings)
    by_location = defaultdict(set)
    for x in findings:
        by_location[x.get("location", "")].add(x.get("pattern", ""))
    with (out / "flagged-paths.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["location", "patterns"])
        for loc in sorted(by_location):
            w.writerow([loc, ";".join(sorted(by_location[loc]))])

    limitations = Counter(x.get("status") for x in statuses if x.get("status") not in {"git_fetch", "git_lfs_fetch", "not_applicable"})
    report = {
        "generated_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "repository": REPO,
        "findings_total": len(findings),
        "findings_by_pattern": dict(sorted(by_pattern.items())),
        "flagged_locations": len(by_location),
        "scan_status_counts": dict(sorted(Counter(x.get("status") for x in statuses).items())),
        "limitations": dict(sorted(limitations.items())),
        "part_summaries": summaries,
        "patterns_tested": patterns,
        "raw_values_in_report": False,
    }
    (out / "summary.json").write_text(json.dumps(report, indent=2, sort_keys=True), encoding="utf-8")

    md = ["# Zero-trust forensic audit evidence", "", f"Repository: `{REPO}`", "", "No matched values are included in this report.", "", "## Coverage summary", ""]
    for item in inventories:
        if item.get("kind") == "summary":
            md.append(f"- `{item.get('source')}` / `{item.get('location')}`: `{json.dumps({k:v for k,v in item.items() if k not in {'source','location','kind'}}, sort_keys=True)}`")
    md += ["", "## Findings by pattern", "", "| Pattern | Count |", "|---|---:|"]
    for p in patterns:
        md.append(f"| `{p}` | {by_pattern.get(p, 0)} |")
    md += ["", "## Scan limitations/status", "", "| Status | Count |", "|---|---:|"]
    for k, v in sorted(Counter(x.get("status") for x in statuses).items()):
        md.append(f"| `{k}` | {v} |")
    md += ["", "See `flagged-paths.csv`, `patterns-tested.csv`, `findings.jsonl`, and `inventory.jsonl` for complete redacted evidence."]
    (out / "REPORT.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    print(json.dumps({"mode": "collate", "findings": len(findings), "flagged_locations": len(by_location), "limitations": dict(limitations)}))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", required=True, choices=["repo", "surfaces", "actions-logs", "actions-artifacts", "collate"])
    ap.add_argument("--out", required=True)
    ap.add_argument("--input")
    ap.add_argument("--shard", type=int, default=0)
    ap.add_argument("--shards", type=int, default=1)
    args = ap.parse_args()
    out = Path(args.out)
    if args.mode == "repo":
        scan_repo(out)
    elif args.mode == "surfaces":
        scan_surfaces(out)
    elif args.mode == "actions-logs":
        scan_action_logs(out, args.shard, args.shards)
    elif args.mode == "actions-artifacts":
        scan_action_artifacts(out, args.shard, args.shards)
    elif args.mode == "collate":
        if not args.input:
            ap.error("--input is required for collate")
        collate(Path(args.input), out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
