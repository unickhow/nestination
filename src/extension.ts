import * as vscode from 'vscode';

function findJsonTarget() {
  const inputOptions: vscode.InputBoxOptions = {
    prompt: 'Enter the JSON target path',
    placeHolder: 'foo.bar.baz',
  };

  vscode.window.showInputBox(inputOptions).then((input) => {
    if (input) {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const document = editor.document;
        const pathSegments = input.split('.');

        for (const segment of pathSegments) {
          const [property, index] = extractPropertyAndIndex(segment);
          const regex = new RegExp(`"\\s*${property}\\s*":\\s*`);
					const match = RegExp(regex).exec(document.getText());

          if (match) {
            const line = document.lineAt(document.positionAt(match.index).line);
            const column = line.text.indexOf(property);
            let currentPosition = new vscode.Position(line.lineNumber, column - 1);

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
