import * as esbuild from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const watch = process.argv.includes('--watch');

mkdirSync(join(__dirname, 'dist'), { recursive: true });

const common = {
  bundle: true,
  target: 'es2017',
  logLevel: 'info',
};

async function build() {
  await esbuild.build({
    ...common,
    entryPoints: [join(__dirname, 'src/code.ts')],
    outfile: join(__dirname, 'dist/code.js'),
    format: 'iife',
  });

  await esbuild.build({
    ...common,
    entryPoints: [join(__dirname, 'src/ui.ts')],
    outfile: join(__dirname, 'dist/ui.js'),
    format: 'iife',
  });

  const uiJs = readFileSync(join(__dirname, 'dist/ui.js'), 'utf8');
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>AccessibleNow Contrast</title>
  <style>
    :root {
      --text: #1A1A2E;
      --muted: #374151;
      --border: #D1D5DB;
      --bg: #FFFFFF;
      --primary: #6D28D9;
      --ok: #1A6B3C;
      --fail: #8B1A1A;
      --ok-bg: #E6F4EC;
      --fail-bg: #FDEAEA;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font: 14px/1.5 Inter, Segoe UI, system-ui, sans-serif;
      color: var(--text);
      background: var(--bg);
      padding: 12px;
    }
    h1 { font-size: 1rem; margin: 0 0 8px; }
    p { margin: 0 0 12px; color: var(--muted); font-size: 0.875rem; }
    button {
      min-height: 44px;
      min-width: 44px;
      padding: 8px 14px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: var(--primary);
      color: #fff;
      font-weight: 600;
      cursor: pointer;
    }
    button.secondary { background: #fff; color: var(--text); }
    button:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
    .row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
    .result {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px;
      margin-top: 8px;
    }
    .pass { background: var(--ok-bg); color: var(--ok); border-color: #A7D4B5; }
    .fail { background: var(--fail-bg); color: var(--fail); border-color: #F5C2C2; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
    .swatch {
      width: 28px; height: 28px; border-radius: 4px; border: 1px solid var(--border);
      display: inline-block; vertical-align: middle; margin-right: 6px;
    }
  </style>
</head>
<body>
  <h1>AccessibleNow Contrast</h1>
  <p>Select a filled shape or text. We compare its fill to the page background (or a second selected fill) against WCAG 2.2 AA.</p>
  <div class="row">
    <button type="button" id="check">Check selection</button>
    <button type="button" class="secondary" id="copy" disabled>Copy CSS snippet</button>
  </div>
  <div id="out" role="status" aria-live="polite"></div>
  <script>${uiJs}</script>
</body>
</html>`;
  writeFileSync(join(__dirname, 'dist/ui.html'), html);
}

if (watch) {
  // Simple rebuild loop — Figma reloads on save of dist/
  await build();
  const { watch: fsWatch } = await import('fs');
  fsWatch(join(__dirname, 'src'), { recursive: true }, () => {
    void build();
  });
} else {
  await build();
}
