# AccessibleNow OSS PR Gate

GitHub Action (AN-F002) that scans changed `package.json` files against the AccessibleNow a11y intelligence API and posts a sticky PR comment.

## Consumer usage

```yaml
# .github/workflows/oss-pr-gate.yml
name: OSS PR Gate
on:
  pull_request:
    paths:
      - '**/package.json'
      - 'package.json'

permissions:
  contents: read
  pull-requests: write

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: AccessibleNow/access-shield-india/.github/actions/oss-pr-gate@main
        with:
          api-url: ${{ vars.ACCESSIBLENOW_API_URL }}
          fail-on: high
```

## Inputs

| Input | Required | Default | Description |
| --- | --- | --- | --- |
| `api-url` | yes | — | API base, e.g. `https://api.accessshield.in` |
| `fail-on` | no | `high` | Fail job if issues ≥ severity (`critical`\|`high`\|`medium`\|`low`); empty = never fail |
| `package-json-paths` | no | auto | Space-separated paths; empty = git-diff detection |
| `include-dev` | no | `true` | Include `devDependencies` |
| `comment` | no | `true` | Sticky PR comment |
| `github-token` | no | `${{ github.token }}` | Token for comments |

## Repo setup

1. Add Actions **variable** (or secret) `ACCESSIBLENOW_API_URL` = your API origin (no trailing slash).
2. Ensure the API’s public `POST /api/v1/oss/scan` is reachable from GitHub-hosted runners.
3. Merge a PR that touches `package.json` — the workflow comments with matched AN-* issues.

## Local dry-run

```bash
export ACCESSIBLENOW_API_URL=http://localhost:4000
export PACKAGE_JSON_PATHS=package.json
export INCLUDE_DEV=true
export FAIL_ON=high
# optional: export GITHUB_OUTPUT=/tmp/gh.out
node .github/actions/oss-pr-gate/scan.mjs
```
