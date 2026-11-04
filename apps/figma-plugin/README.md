# AccessibleNow Contrast (Figma plugin)

Phase 1 scaffold for **AN-F010** — WCAG 2.2 contrast check on selected fills.

## Develop locally

```bash
pnpm --filter @accessiblenow/figma-plugin install
pnpm --filter @accessiblenow/figma-plugin build
```

## Import in Figma Desktop

1. Open Figma Desktop → menu **Plugins** → **Development** → **Import plugin from manifest…**
2. Select `apps/figma-plugin/manifest.json` (points at `dist/`).
3. Run **AccessibleNow Contrast** from Development plugins.
4. Select a layer with a solid fill (optionally a second fill as background). Click **Check selection**.
5. On fail, use **Copy CSS snippet** for a suggested `color:` value (≥ 4.5:1).

Rebuild after edits (`pnpm --filter @accessiblenow/figma-plugin build`), then re-run the plugin.

## Not in this scaffold

- Figma Community publish
- Live sync to AccessibleNow API
- Auto-apply fill changes on the canvas (copy-only for now)
