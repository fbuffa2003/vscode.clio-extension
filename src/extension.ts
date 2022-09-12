import * as vscode from 'vscode';
import { fileURLToPath } from 'url';
import {EnvironmentService} from './service/environmentService';


let terminal: vscode.Terminal | undefined;

export function activate(context: vscode.ExtensionContext) {
	
	const clioPath = 'C:\\Users\\k.krylov.TSCRM\\.dotnet\\tools\\clio.exe';

	const envService = new EnvironmentService();
	vscode.window.registerTreeDataProvider('vscode-clio-extension.creatioExplorer', envService);

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
	

	let restartCommand = vscode.commands.registerCommand('ClioSQL.restart', (node: vscode.TreeItem) => {
		if(!node.label){
			return;
		}
		let isWin = process.platform === 'win32';
		terminal = terminal || vscode.window.createTerminal('clio sql console', isWin ? 'C:\\Windows\\System32\\cmd.exe' : undefined);
		terminal.show();
		terminal.sendText(`${isWin ? '' : 'wine '}"${clioPath}"  restart -e "${node.label}"`);
		vscode.window.onDidCloseTerminal(closedTerminal => {
			if (closedTerminal === terminal) {
				terminal = undefined;
			}
		});
	});
	context.subscriptions.push(restartCommand);


	let flushdbCommand = vscode.commands.registerCommand('ClioSQL.flushDb', (node: vscode.TreeItem) => {
		if(!node.label){
			return;
		}
		let isWin = process.platform === 'win32';
		terminal = terminal || vscode.window.createTerminal('clio sql console', isWin ? 'C:\\Windows\\System32\\cmd.exe' : undefined);
		terminal.show();
		terminal.sendText(`${isWin ? '' : 'wine '}"${clioPath}"  flushdb -e "${node.label}"`);
		vscode.window.onDidCloseTerminal(closedTerminal => {
			if (closedTerminal === terminal) {
				terminal = undefined;
			}
		});
	});
	context.subscriptions.push(flushdbCommand);

}
export function deactivate() {}
