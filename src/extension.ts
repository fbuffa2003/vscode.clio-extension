import * as vscode from 'vscode';
import { fileURLToPath } from 'url';

let terminal: vscode.Terminal | undefined;

export function activate(context: vscode.ExtensionContext) {
	
	let disposable = vscode.commands.registerCommand('ClioSQL.console', () => {
		let commandsDocument = vscode.window.activeTextEditor?.document;
		let text : string = commandsDocument?.getText() as string;
		if(!text){
			return;
		}
        let filePath = 'E:\\Projects\\clio\\clio\\bin\\Release\\netcoreapp3.1\\clio.exe';
		let isWin = process.platform === 'win32';
		terminal = terminal || vscode.window.createTerminal('clio sql console', isWin ? 'C:\\Windows\\System32\\cmd.exe' : undefined);
		terminal.show();
		terminal.sendText(`${isWin ? '' : 'wine '}"${filePath}"  sql "${text}"`);
		vscode.window.onDidCloseTerminal(closedTerminal => {
			if (closedTerminal === terminal) {
				terminal = undefined;
			}
		});
	});

	context.subscriptions.push(disposable);
}
export function deactivate() {}
