import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  let findKeyCommand = vscode.commands.registerCommand('nestination.goto', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'json') {
      return;
    }

    vscode.window.showInputBox({
      prompt: 'Enter key path.',
      placeHolder: 'e.g. foo.bar.baz'
    }).then((keyPath) => {
      if (keyPath) {
        const position = findKeyPosition(editor, keyPath);
        if (position) {
          const lineRange = editor.document.lineAt(position.line).range;
          editor.selection = new vscode.Selection(lineRange.start, lineRange.end);
          editor.revealRange(lineRange);
        } else {
          vscode.window.showErrorMessage(`Key "${keyPath}" not found`);
        }
      }
    });
  });

  context.subscriptions.push(findKeyCommand);
}

function findKeyPosition(editor: vscode.TextEditor, path: string): vscode.Position | null {
  const document = editor.document;
  const keys = path.split('.'); // e.g. foo.bar.baz => ['foo', 'bar', 'baz']
  let regexPatterns = keys.map(key => ({ key, regex: new RegExp(`"${key}":`)})); // e.g. [{key: 'foo', regex: /"foo":/}, {key: 'bar', regex: /"bar":/}, {key: 'baz', regex: /"baz":/}]

  let tempLine = 1;
  const foundKeys = Array.from({ length: keys.length }, () => false);

  for (let level = 0; level < keys.length; level++) {
    const lineCount = document.lineCount;
    let line = tempLine;
    const regexPattern = regexPatterns[level];
    while (line < lineCount) {
      const lineText = document.lineAt(line).text;
      if (regexPattern.regex.test(lineText)) {
        tempLine = line + 1; // in case of the same key in nested, e.g. 'foo.foo.bar'
        foundKeys[level] = true;
        break;
      }
      line++;
    }
  }

  if (foundKeys.every(Boolean)) {
    return new vscode.Position(tempLine - 1, 0); // resume the line added in the loop
  } else {
    return null;
  }
}

export function deactivate() {}
