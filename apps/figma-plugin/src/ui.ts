import type { ContrastResult } from './contrast';

const out = document.getElementById('out')!;
const checkBtn = document.getElementById('check') as HTMLButtonElement;
const copyBtn = document.getElementById('copy') as HTMLButtonElement;

let lastSnippet = '';

function renderResult(result: ContrastResult | { error: string }) {
  if ('error' in result) {
    out.innerHTML = `<div class="result fail" role="alert">${escapeHtml(result.error)}</div>`;
    copyBtn.disabled = true;
    lastSnippet = '';
    return;
  }

  const pass = result.aaNormal;
  const cls = pass ? 'pass' : 'fail';
  const status = pass ? 'Passes WCAG 2.2 AA (normal text)' : 'Fails WCAG 2.2 AA (normal text 4.5:1)';
  lastSnippet = `color: ${result.suggestedForegroundHex}; /* bg ${result.backgroundHex}; ratio was ${result.ratio.toFixed(2)}:1 */`;

  out.innerHTML = `
    <div class="result ${cls}">
      <p><strong>${escapeHtml(status)}</strong></p>
      <p>
        <span class="swatch" style="background:${result.foregroundHex}"></span>
        Foreground <code>${result.foregroundHex}</code>
        vs
        <span class="swatch" style="background:${result.backgroundHex}"></span>
        Background <code>${result.backgroundHex}</code>
      </p>
      <p>Contrast ratio: <strong>${result.ratio.toFixed(2)}:1</strong>
        · AA large (≥3:1): ${result.aaLarge ? 'yes' : 'no'}
        · AAA (≥7:1): ${result.aaaNormal ? 'yes' : 'no'}
      </p>
      ${
        pass
          ? ''
          : `<p>Suggested foreground: <code>${result.suggestedForegroundHex}</code></p>`
      }
    </div>
  `;
  copyBtn.disabled = false;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

checkBtn.addEventListener('click', () => {
  parent.postMessage({ pluginMessage: { type: 'check' } }, '*');
});

copyBtn.addEventListener('click', async () => {
  if (!lastSnippet) return;
  try {
    await navigator.clipboard.writeText(lastSnippet);
    copyBtn.textContent = 'Copied';
    setTimeout(() => {
      copyBtn.textContent = 'Copy CSS snippet';
    }, 1500);
  } catch {
    copyBtn.textContent = 'Copy failed';
  }
});

onmessage = (event: MessageEvent) => {
  const msg = event.data?.pluginMessage as
    | { type: 'result'; result: ContrastResult | { error: string } }
    | undefined;
  if (msg?.type === 'result') {
    renderResult(msg.result);
  }
};
