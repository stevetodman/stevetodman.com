#!/usr/bin/env python3
"""Classify sensitive-pattern candidates without emitting matched values."""
from __future__ import annotations
import json, math, re, subprocess
from collections import Counter

PATTERNS = {
    "google_api_key": re.compile(r"\bAIza[0-9A-Za-z_-]{35}\b"),
    "github_pat": re.compile(r"\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b"),
    "openai_api_key": re.compile(r"\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b"),
    "private_key_header": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----"),
    "jwt_candidate": re.compile(r"\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b"),
    "email": re.compile(r"(?i)\b[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}\b"),
}
ASSIGN = re.compile(r"(?i)\b(secret|token|password|passwd|pwd|api[_ -]?key|client[_ -]?secret|service[_ -]?role|authorization)\b([^\n:=]{0,40})[:=]\s*[\"']?([A-Za-z0-9_./+\-=]{12,})")
PLACEHOLDER_WORDS = ("example", "placeholder", "changeme", "your_", "your-", "dummy", "fake", "redacted", "xxxx", "process.env", "os.environ")
FIXTURE_WORDS = ("test", "fixture", "synthetic", "canary", "mock", "example")

def run(*args):
    p=subprocess.run(args,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
    if p.returncode: raise RuntimeError(p.stderr.decode('utf-8','replace')[:300])
    return p.stdout

def entropy(s):
    c=Counter(s); n=len(s)
    return -sum((v/n)*math.log2(v/n) for v in c.values()) if s else 0

def redact(line, matches):
    spans=[]
    for m in matches: spans.append((m.start(),m.end()))
    for m in ASSIGN.finditer(line): spans.append((m.start(3),m.end(3)))
    for a,b in sorted(spans,reverse=True): line=line[:a]+'[REDACTED]'+line[b:]
    line=PATTERNS['email'].sub('[REDACTED-EMAIL]',line)
    return line[:220]

def classification(path,line,value=None):
    low=(path+' '+line).lower()
    if any(w in low for w in PLACEHOLDER_WORDS): return 'placeholder_or_example'
    if any(w in low for w in FIXTURE_WORDS) or path.startswith('tests/') or '/tests/' in path: return 'test_or_synthetic_fixture'
    if value is not None and entropy(value) < 3.5: return 'low_entropy_literal'
    return 'static_literal_review_required'

def main():
    # Fetch every non-audit branch/tag/retained PR head to mirror the definitive scan.
    specs=['+refs/heads/*:refs/remotes/origin/*','+refs/tags/*:refs/tags/*','+refs/pull/*/head:refs/remotes/pull/*/head']
    subprocess.run(['git','fetch','origin',*specs,'--force'],check=True,stdout=subprocess.DEVNULL)
    for ref in ['refs/remotes/origin/audit/forensic-zero-trust-20260904','refs/remotes/pull/187/head']:
        subprocess.run(['git','update-ref','-d',ref],check=False)
    rev=run('git','rev-list','--objects','--all').decode().splitlines()
    paths={}; ids=[]
    for line in rev:
        p=line.split(' ',1); ids.append(p[0]);
        if len(p)==2: paths.setdefault(p[0],set()).add(p[1])
    proc=subprocess.Popen(['git','cat-file','--batch-check=%(objectname) %(objecttype) %(objectsize)'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,text=True)
    out,_=proc.communicate('\n'.join(ids)+'\n')
    blobs=[x.split()[0] for x in out.splitlines() if len(x.split())==3 and x.split()[1]=='blob' and int(x.split()[2])<=50*1024*1024]
    findings=[]
    for sha in blobs:
        data=run('git','cat-file','blob',sha)
        if b'\x00' in data[:8192]: continue
        text=data.decode('utf-8','replace')
        path=sorted(paths.get(sha) or {f'blob:{sha}'})[0]
        for n,line in enumerate(text.splitlines(),1):
            for pid,rx in PATTERNS.items():
                if pid=='email': continue
                ms=list(rx.finditer(line))
                for m in ms:
                    findings.append({'pattern':pid,'path':path,'line':n,'sha':sha,'classification':classification(path,line,m.group(0)),'safe_context':redact(line,ms)})
            for m in ASSIGN.finditer(line):
                value=m.group(3)
                if entropy(value)>=3.5 and not any(w in value.lower() for w in PLACEHOLDER_WORDS):
                    findings.append({'pattern':'high_entropy_secret_assignment','path':path,'line':n,'sha':sha,'classification':classification(path,line,value),'assignment_kind':m.group(1).lower().replace(' ','_'),'safe_context':redact(line,[])})
    # Current-main non-placeholder email locations, without values/domains.
    tree=run('git','ls-tree','-r','refs/remotes/origin/main').decode().splitlines()
    for row in tree:
        parts=row.split(None,3)
        if len(parts)<4 or parts[1]!='blob': continue
        sha=parts[2]; path=parts[3].split('\t')[-1]
        data=run('git','cat-file','blob',sha)
        if b'\x00' in data[:8192]: continue
        for n,line in enumerate(data.decode('utf-8','replace').splitlines(),1):
            for m in PATTERNS['email'].finditer(line):
                val=m.group(0).lower()
                cls='placeholder_or_example' if any(x in val for x in ('example.com','example.org','invalid','users.noreply.github.com')) or any(w in (path+' '+line).lower() for w in FIXTURE_WORDS) else 'nonplaceholder_email'
                findings.append({'pattern':'current_email','path':path,'line':n,'sha':sha,'classification':cls})
    print(json.dumps({'findings':findings,'matched_values_emitted':False},indent=2,sort_keys=True))
if __name__=='__main__': main()
