import * as vscode from 'vscode';
import { fileURLToPath } from 'url';
import {EnvironmentService} from './service/environmentService';
import { AddConnection, FormData } from './pannels/AddConnection';


let terminal: vscode.Terminal | undefined;

export function activate(context: vscode.ExtensionContext) {
	
	const clioPath = 'clio';

	const envService = new EnvironmentService();
	vscode.window.registerTreeDataProvider('vscode-clio-extension.creatioExplorer', envService);

	let disposable = vscode.commands.registerCommand('ClioSQL.ExecuteSql', (node: vscode.TreeItem) => {
		let commandsDocument = vscode.window.activeTextEditor?.document;
		let text : string = commandsDocument?.getText() as string;
		if(!text){
			return;
		}
		let filePath = 'clio';
		let isWin = process.platform === 'win32';
		terminal = terminal || vscode.window.createTerminal('clio sql console', isWin ? 'C:\\Windows\\System32\\cmd.exe' : undefined);
		terminal.show();
		terminal.sendText(`${isWin ? '' : 'wine '}"${filePath}"  sql "${text}" -e "${node.label}"`);
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

	let openCommand = vscode.commands.registerCommand('ClioSQL.Open', (node: vscode.TreeItem) => {
		if(!node.label){
			return;
		}
		let isWin = process.platform === 'win32';
		terminal = terminal || vscode.window.createTerminal('clio sql console', isWin ? 'C:\\Windows\\System32\\cmd.exe' : undefined);
		terminal.sendText(`${isWin ? '' : 'wine '}"${clioPath}"  open -e "${node.label}"`);
		vscode.window.onDidCloseTerminal(closedTerminal => {
			if (closedTerminal === terminal) {
				terminal = undefined;
			}
		});
	});
	context.subscriptions.push(openCommand);

	
	context.subscriptions.push(
		vscode.commands.registerCommand("ClioSQL.RegisterWebApp", (args: FormData )=>{
			let isWin = process.platform === 'win32';
			terminal = terminal || vscode.window.createTerminal('clio sql console', isWin ? 'C:\\Windows\\System32\\cmd.exe' : undefined);
			terminal.show();
			terminal.sendText(`${isWin ? '' : 'wine '} ${clioPath} reg-web-app ${args.name} -u ${args.url} -l ${args.username} -p ${args.password} -m ${args.maintainer} -i ${args.isNetCore} -c ${args.isDeveloperModeEnabled} -s ${args.isSafe}`);

			vscode.window.onDidCloseTerminal(closedTerminal => {
				if (closedTerminal === terminal) {
					terminal = undefined;
				}
			});
			envService.refresh();
	}));


	context.subscriptions.push(
		vscode.commands.registerCommand("ClioSQL.AddConnection", ()=>{
			AddConnection.createOrShow(context.extensionUri);
		})
	);

}
export function deactivate() {}
