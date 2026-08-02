# CI and deployment policy

- GitHub `main` is the production source of truth.
- Keep one consolidated test workflow. Do not add a second workflow that repeats syntax, integrity, or browser tests already run by `.github/workflows/tests.yml`.
- During development, test locally and batch related changes before pushing.
- Pull-request CI uses concurrency cancellation so superseded runs stop automatically.
- Intermediate commits that should not trigger a Cloudflare Pages build should include `[CF-Pages-Skip]` in the commit message.
- The cooking-index workflow is isolated to `cooking/*-timer.html` changes on `main`.
