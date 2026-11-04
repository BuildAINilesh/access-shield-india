import * as vscode from 'vscode';

interface CodeViolation {
  ruleId: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  learnPath?: string;
}

interface AnalyzeResponse {
  data: {
    violations: CodeViolation[];
  };
}

interface FixResponse {
  data: {
    fixedCode: string;
    explanation: string;
  };
}

const collection = vscode.languages.createDiagnosticCollection('accessiblenow');

function filetypeForDoc(doc: vscode.TextDocument): string | null {
  switch (doc.languageId) {
    case 'html':
      return 'html';
    case 'javascriptreact':
      return 'jsx';
    case 'typescriptreact':
      return 'tsx';
    default:
      return null;
  }
}

function severityMap(
  severity: CodeViolation['severity'],
): vscode.DiagnosticSeverity {
  if (severity === 'error') return vscode.DiagnosticSeverity.Error;
  if (severity === 'warning') return vscode.DiagnosticSeverity.Warning;
  return vscode.DiagnosticSeverity.Information;
}

async function analyzeDocument(doc: vscode.TextDocument): Promise<void> {
  const filetype = filetypeForDoc(doc);
  if (!filetype) {
    return;
  }

  const config = vscode.workspace.getConfiguration('accessiblenow');
  const apiUrl = (config.get<string>('apiUrl') ?? 'http://localhost:4000').replace(/\/$/, '');
  const token = config.get<string>('apiToken') ?? '';

  if (!token) {
    vscode.window.setStatusBarMessage(
      'AccessibleNow: set accessiblenow.apiToken to enable analysis',
      5000,
    );
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/api/v1/code/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        code: doc.getText(),
        filetype,
        filePath: doc.uri.fsPath,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API ${response.status}: ${text.slice(0, 200)}`);
    }

    const payload = (await response.json()) as AnalyzeResponse;
    const diagnostics: vscode.Diagnostic[] = (payload.data?.violations ?? []).map((v) => {
      const range = new vscode.Range(
        Math.max(0, v.line - 1),
        Math.max(0, v.column - 1),
        Math.max(0, v.endLine - 1),
        Math.max(0, v.endColumn - 1),
      );
      const diagnostic = new vscode.Diagnostic(range, v.message, severityMap(v.severity));
      diagnostic.code = v.ruleId;
      diagnostic.source = 'AccessibleNow';
      return diagnostic;
    });

    collection.set(doc.uri, diagnostics);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(`AccessibleNow analyze failed: ${message}`);
  }
}

async function applyQuickFix(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const diagnostics = collection.get(editor.document.uri) ?? [];
  const atCursor = diagnostics.find((d) => d.range.contains(editor.selection.active));
  if (!atCursor || typeof atCursor.code !== 'string') {
    vscode.window.showInformationMessage('No AccessibleNow diagnostic at cursor');
    return;
  }

  const config = vscode.workspace.getConfiguration('accessiblenow');
  const apiUrl = (config.get<string>('apiUrl') ?? 'http://localhost:4000').replace(/\/$/, '');
  const token = config.get<string>('apiToken') ?? '';
  if (!token) {
    vscode.window.showWarningMessage('Set accessiblenow.apiToken first');
    return;
  }

  const snippet = editor.document.getText(atCursor.range.with({
    start: atCursor.range.start.with({ character: 0 }),
    end: editor.document.lineAt(atCursor.range.end.line).range.end,
  }));

  try {
    const response = await fetch(`${apiUrl}/api/v1/code/fix`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        code: snippet,
        ruleId: atCursor.code,
        filetype: filetypeForDoc(editor.document) ?? 'html',
      }),
    });

    if (!response.ok) {
      throw new Error(`API ${response.status}`);
    }

    const payload = (await response.json()) as FixResponse;
    const fixed = payload.data?.fixedCode;
    if (!fixed) {
      throw new Error('No fix returned');
    }

    await editor.edit((editBuilder) => {
      editBuilder.replace(
        editor.document.lineAt(atCursor.range.start.line).range,
        fixed,
      );
    });

    vscode.window.showInformationMessage(
      payload.data.explanation?.slice(0, 120) ?? 'Fix applied',
    );
    await analyzeDocument(editor.document);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(`AccessibleNow fix failed: ${message}`);
  }
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(collection);

  context.subscriptions.push(
    vscode.commands.registerCommand('accessiblenow.analyzeFile', async () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        await analyzeDocument(editor.document);
      }
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('accessiblenow.applyQuickFix', () => applyQuickFix()),
  );

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (doc) => {
      const analyzeOnSave = vscode.workspace
        .getConfiguration('accessiblenow')
        .get<boolean>('analyzeOnSave');
      if (analyzeOnSave && filetypeForDoc(doc)) {
        await analyzeDocument(doc);
      }
    }),
  );
}

export function deactivate(): void {
  collection.dispose();
}
