# @accessiblenow/scan

CLI for **AN OSS** (AN-F002) — scans `package.json` against AccessibleNow’s a11y intelligence database.

## Usage

```bash
# from monorepo
pnpm --filter @accessiblenow/scan build
ACCESSIBLENOW_API_URL=http://localhost:4000 node apps/cli/dist/cli.js ./package.json

# fail CI if high/critical issues found
node apps/cli/dist/cli.js ./package.json --fail-on=high

# JSON for automation
node apps/cli/dist/cli.js ./package.json --json

# search intelligence DB
node apps/cli/dist/cli.js search react-select
node apps/cli/dist/cli.js search --package=antd --severity=medium
```

Bins after install: `accessiblenow-scan`, `an-scan`.

Env: `ACCESSIBLENOW_API_URL` (default `http://localhost:4000`).

## PR Gate (CI)

Use the composite Action in `.github/actions/oss-pr-gate` — it calls the same API and posts a sticky PR comment when `package.json` changes. See that folder’s README.
