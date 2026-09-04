#!/usr/bin/env python3
"""Full reachable-Git-object audit at the pre-instrumentation snapshot.

This deliberately excludes the temporary audit branch and audit PR refs while
including all other branch, tag, and retained pull-request refs exposed by
GitHub. Matched values are never emitted.
"""
from __future__ import annotations

import json
import re
import subprocess
from collections import defaultdict
from pathlib import Path

import forensic_repo_audit as base

AUDIT_BRANCH_REF = "refs/remotes/origin/audit/forensic-zero-trust-20260904"
AUDIT_PR_HEAD = "refs/remotes/pull/187/head"
AUDIT_PR_MERGE = "refs/remotes/pull/187/merge"


def gout(args: list[str], timeout: int = 600) -> str:
    p = base.run(["git"] + args, timeout=timeout)
    if p.returncode != 0:
        raise RuntimeError(p.stderr.decode("utf-8", "replace")[:500])
    return p.stdout.decode("utf-8", "replace")


def remove_ref(ref: str) -> None:
    base.run(["git", "update-ref", "-d", ref], timeout=30)


def main() -> int:
    out = Path("audit-out/repo")
    s = base.Scanner(out)

    # Fetch every currently exposed code ref that can retain historical content.
    fetch_specs = [
        "+refs/heads/*:refs/remotes/origin/*",
        "+refs/tags/*:refs/tags/*",
        "+refs/pull/*/head:refs/remotes/pull/*/head",
        "+refs/pull/*/merge:refs/remotes/pull/*/merge",
    ]
    p = base.run(["git", "fetch", "origin", *fetch_specs, "--force"], timeout=1200)
    s.status("git_fetch_all_refs", "origin", f"rc={p.returncode}")
    if p.returncode != 0:
        # Retry heads/tags and PR ref families separately; some servers omit merge refs.
        p1 = base.run(["git", "fetch", "origin", fetch_specs[0], fetch_specs[1], "--force"], timeout=900)
        p2 = base.run(["git", "fetch", "origin", fetch_specs[2], "--force"], timeout=900)
        p3 = base.run(["git", "fetch", "origin", fetch_specs[3], "--force"], timeout=900)
        s.status("git_fetch_heads_tags", "origin", f"rc={p1.returncode}")
        s.status("git_fetch_pr_heads", "origin", f"rc={p2.returncode}")
        s.status("git_fetch_pr_merges", "origin", f"rc={p3.returncode}")
        if p1.returncode != 0 or p2.returncode != 0:
            raise RuntimeError("Unable to fetch required branch/tag/PR-head refs")

    # Remove only audit-generated refs so the scan describes the repository immediately
    # before this forensic instrumentation was added.
    for ref in (AUDIT_BRANCH_REF, AUDIT_PR_HEAD, AUDIT_PR_MERGE):
        remove_ref(ref)
    # Detach at the pre-audit main ref so HEAD itself cannot retain audit-only content.
    p = base.run(["git", "checkout", "--detach", "refs/remotes/origin/main"], timeout=60)
    s.status("checkout_main_snapshot", "refs/remotes/origin/main", f"rc={p.returncode}")

    # Pull every LFS object reachable from fetched refs when Git LFS is available.
    lfs = base.run(["git", "lfs", "fetch", "--all"], timeout=1200)
    s.status("git_lfs_fetch_all", "origin", f"rc={lfs.returncode}")

    branches = [x for x in gout(["for-each-ref", "--format=%(refname)", "refs/remotes/origin"]).splitlines() if x and x != "refs/remotes/origin/HEAD"]
    pr_heads = [x for x in gout(["for-each-ref", "--format=%(refname)", "refs/remotes/pull"]).splitlines() if x.endswith("/head")]
    pr_merges = [x for x in gout(["for-each-ref", "--format=%(refname)", "refs/remotes/pull"]).splitlines() if x.endswith("/merge")]
    tags = [x for x in gout(["for-each-ref", "--format=%(refname)", "refs/tags"]).splitlines() if x]
    commits = sorted(set(x for x in gout(["rev-list", "--all"]).splitlines() if x))
    s.inventory(source="git:full", location="refs", kind="summary", branches=len(branches), pr_head_refs=len(pr_heads), pr_merge_refs=len(pr_merges), tags=len(tags), reachable_commits=len(commits))

    # Commit messages, author/committer identities, and email addresses.
    meta = gout(["log", "--all", "--format=COMMIT:%H%nAUTHOR_NAME:%an%nAUTHOR_EMAIL:%ae%nCOMMITTER_NAME:%cn%nCOMMITTER_EMAIL:%ce%n%B%n--END--"], timeout=600)
    for block in meta.split("--END--"):
        m = re.search(r"COMMIT:([0-9a-f]{40})", block)
        if m:
            sha = m.group(1)
            s.scan_text(block, source="git:commit-metadata", location=f"commit:{sha}", object_sha=sha)

    rev = gout(["rev-list", "--objects", "--all"], timeout=600)
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

    proc = subprocess.Popen(
        ["git", "cat-file", "--batch-check=%(objectname) %(objecttype) %(objectsize)"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    batch_out, batch_err = proc.communicate("\n".join(object_ids) + "\n", timeout=900)
    if proc.returncode != 0:
        s.status("cat_file_batch_failed", "git", batch_err[:300])
        raise RuntimeError("git cat-file batch failed")
    blobs = {}
    for line in batch_out.splitlines():
        p = line.split()
        if len(p) == 3 and p[1] == "blob":
            blobs[p[0]] = int(p[2])
    s.inventory(source="git:full", location="objects", kind="summary", reachable_objects=len(set(object_ids)), unique_blobs=len(blobs))

    # Every reachable blob is read directly. Identical content is scanned once, then all
    # historical path aliases are retained for expansion in the final evidence table.
    read_failures = 0
    for sha, size in blobs.items():
        b = base.run(["git", "cat-file", "blob", sha], timeout=180)
        if b.returncode != 0:
            read_failures += 1
            s.status("blob_read_failed", sha, f"rc={b.returncode}")
            continue
        locs = sorted(paths.get(sha) or {f"blob:{sha}"})
        primary = locs[0]
        s.scan_bytes(b.stdout, source="git:full-history", location=primary, object_sha=sha)
        for alias in locs[1:]:
            s.inventory(source="git:history-alias", location=alias, kind="alias", object_sha=sha, primary=primary)
    s.inventory(source="git:full", location="blob-read", kind="summary", attempted=len(blobs), failures=read_failures)

    # Independently enumerate every file currently tracked on main.
    main_ref = "refs/remotes/origin/main"
    tree = base.run(["git", "ls-tree", "-r", "-z", main_ref], timeout=300)
    if tree.returncode != 0:
        s.status("current_tree_failed", main_ref, f"rc={tree.returncode}")
        raise RuntimeError("Unable to enumerate current main tree")
    tracked = 0
    for rec in tree.stdout.split(b"\x00"):
        if not rec:
            continue
        head, rawpath = rec.split(b"\t", 1)
        mode, typ, sha = head.decode().split()
        path = rawpath.decode("utf-8", "replace")
        tracked += 1
        s.inventory(source="git:current-main", location=path, kind=typ, mode=mode, object_sha=sha)
        if mode == "160000":
            s.finding("git_submodule", "git:current-main", path, object_sha=sha)
    main_sha = gout(["rev-parse", main_ref]).strip()
    s.inventory(source="git:current-main", location="tree", kind="summary", tracked_entries=tracked, main_sha=main_sha)

    summary = {
        "mode": "repo-full",
        "branches": len(branches),
        "pr_head_refs": len(pr_heads),
        "pr_merge_refs": len(pr_merges),
        "tags": len(tags),
        "reachable_commits": len(commits),
        "reachable_objects": len(set(object_ids)),
        "unique_blobs": len(blobs),
        "blob_read_failures": read_failures,
        "tracked_main_entries": tracked,
        "main_sha": main_sha,
        "finding_counts": dict(s.counts),
    }
    (out / "summary.json").write_text(json.dumps(summary, indent=2, sort_keys=True), encoding="utf-8")
    print(json.dumps(summary, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
