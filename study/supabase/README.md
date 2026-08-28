# Study family-save operations

`studyhub-save` authenticates with an existing random family token. Only its
SHA-256 hash (`studyhub-v1:` + token, UTF-8, lowercase hex) is stored in
`studyhub.saves`. The public function reads and updates existing rows only;
it never inserts. The `studyhub` schema remains private, with RLS enabled
and no public policies. The function keeps its existing custom bearer-token
authentication (`verify_jwt: false`), not Supabase user login.

## Existing devices and new devices

Existing rows and tokens are preserved. On a linked device, open Device settings
and share the private device link. Open it on the new device; the fragment is
removed from the address bar after adoption. Local progress is retained and
merged when syncing. Never put the private link or token in GitHub, logs, or a
support screenshot. Unlinked devices can still practice and save locally.

## Provisioning a genuinely new family

This is an authenticated owner/administrator operation, not a public endpoint.
Generate 24 cryptographically random bytes locally and encode them as 48 hex
characters. Compute the SHA-256 described above locally. Using an authenticated
database connection, insert **only the hash**, with empty data:

```sql
insert into studyhub.saves (token_hash, data, revision)
values ('REPLACE_WITH_64_CHARACTER_SHA256_HASH', '{}'::jsonb, 1)
on conflict (token_hash) do nothing;
```

Share `https://stevetodman.com/study/#k=PRIVATE_TOKEN` privately. Keep the raw
token out of SQL history. Do not replace, clear, or rotate an existing family
row to provision another device; use that family's existing link instead.

## Limits and release verification

The function reads at most 256 KiB per request, measured as bytes while streaming.
It rejects a merged record above 1 MiB without updating the database. The client
retains local progress and reports cloud capacity errors distinctly from offline
status. The initial rollout's largest existing save was below 26 KiB.

`scripts/verify-study-cloud.sh` and `scripts/verify-study-reward-ledger.mjs` use
the existing public synthetic canary row only. The rejection probe must return
403 without creating a new row. Never use family credentials for these checks.
The canary token is deliberately public and grants access only to synthetic data.

This change bounds row creation and stored size; it is not a general DDoS
protection system. CORS is browser interoperability, not authentication. No new
database objects, public grants, registration endpoint, or scheduled job were added.
