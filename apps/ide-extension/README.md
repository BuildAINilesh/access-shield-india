# AccessibleNow Code (VS Code)

Phase 1 scaffold for **AN-F001** — inline accessibility diagnostics via the AccessibleNow API.

## Setup

1. Start the API (`pnpm --filter @accessshield/api dev`).
2. Apply DB migration `0011_code_fix_phase1` (`pnpm db:migrate`).
3. From this folder: `pnpm install && pnpm compile`.
4. Open the folder in VS Code → Run **Extension Development Host** (F5).
5. Set settings:
   - `accessiblenow.apiUrl` — default `http://localhost:4000`
   - `accessiblenow.apiToken` — Bearer JWT for a developer/customer_admin user

## Commands

- **AccessibleNow: Analyze Accessibility** — POST `/api/v1/code/analyze`
- **AccessibleNow: Apply Quick Fix** — POST `/api/v1/code/fix` on diagnostic at cursor

Analysis also runs on save when `accessiblenow.analyzeOnSave` is true (HTML / JSX / TSX).
