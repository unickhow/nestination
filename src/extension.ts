import * as vscode from 'vscode';

function findJsonTarget() {
  const inputOptions: vscode.InputBoxOptions = {
    prompt: 'Enter the JSON target path',
    placeHolder: 'foo.bar.baz',
  };

  vscode.window.showInputBox(inputOptions).then((input) => {
    const editor = vscode.window.activeTextEditor;
    if (!input || !editor) { return; }

    const document = editor.document;
    const pathSegments = input.split('.');
    const level = pathSegments.length;
    let currentLevel = 1;
    let tempLine = 0;
    let tempIndex = 0;
    const totalLines = document.lineCount;

    for (const segment of pathSegments) {
      const [property] = extractPropertyAndIndex(segment);
      const regex = new RegExp(`"\\s*${property}\\s*":\\s*`);
      const range = new vscode.Range(tempLine, 0, totalLines - 1, document.lineAt(totalLines - 1).text.length);
      const match = RegExp(regex).exec(document.getText(range));

      if (match && currentLevel < level) {
        const line = document.lineAt(document.positionAt(match.index + tempIndex).line);
        tempIndex = match.index;
        tempLine = line.lineNumber;
        currentLevel++;
      } else if (currentLevel === level) {
        const line = document.lineAt(tempLine + 1);
        let currentPosition = new vscode.Position(line.lineNumber, 0);

        vscode.window.activeTextEditor!.selection = new vscode.Selection(
          currentPosition,
          new vscode.Position(line.lineNumber, line.range.end.character)
        );
        vscode.window.activeTextEditor?.revealRange(
          new vscode.Range(currentPosition, new vscode.Position(line.lineNumber, line.range.end.character)),
          vscode.TextEditorRevealType.InCenter
        );
      } else {
        vscode.window.showInformationMessage(`Property "${property}" not found.`);
        break;
      }
    }
  });
}

function extractPropertyAndIndex(segment: string): [string, number | undefined] {
	const match = RegExp(/(.+?)\[(\d+)\]$/).exec(segment);
  if (match) {
    const property = match[1];
    const index = parseInt(match[2], 10);
    return [property, index];
  } else {
    return [segment, undefined];
  }
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('nestination.goto', findJsonTarget)
  );
}

export function deactivate() {}
