import * as vscode from 'vscode';
import { fileURLToPath } from 'url';
import {EnvironmentService} from './service/environmentService';
import { AddConnection, FormData } from './pannels/AddConnection';
import {ClioExecutor} from './Common/clioExecutor';

let terminal: vscode.Terminal | undefined;
let clioExecutor : ClioExecutor  | undefined;

function getClioExecutor(): ClioExecutor {
	if(clioExecutor){
		return clioExecutor;
	}
	return clioExecutor = new ClioExecutor();
}

export function activate(context: vscode.ExtensionContext) {
	
	const envService = new EnvironmentService();
	vscode.window.registerTreeDataProvider('vscode-clio-extension.creatioExplorer', envService);

	let disposable = vscode.commands.registerCommand('ClioSQL.ExecuteSql', (node: vscode.TreeItem) => {
		let commandsDocument = vscode.window.activeTextEditor?.document;
		let text : string = commandsDocument?.getText() as string;
		if(!text || !node.label){
			return;
		}
		//let sqlRequestResult = getClioExecutor().executeClioCommand(`sql "${text}" -e "${node.label}"`) as string;
		getClioExecutor().executeCommandByTerminal(`sql "${text}" -e "${node.label}"`);
	});

	context.subscriptions.push(disposable);
	
	let restartCommand = vscode.commands.registerCommand('ClioSQL.restart', (node: vscode.TreeItem) => {
		if(!node.label){
			return;
		}
		getClioExecutor().executeCommandByTerminal(`restart -e "${node.label}"`);
	});
	context.subscriptions.push(restartCommand);


	let flushdbCommand = vscode.commands.registerCommand('ClioSQL.flushDb', (node: vscode.TreeItem) => {
		if(!node.label){
			return;
		}
		getClioExecutor().executeCommandByTerminal(`flushdb -e "${node.label}"`);
	});
	context.subscriptions.push(flushdbCommand);

	let openCommand = vscode.commands.registerCommand('ClioSQL.Open', (node: vscode.TreeItem) => {
		if(!node.label){
			return;
		}
		getClioExecutor().executeCommandByTerminal(`open -e "${node.label}"`);
	});
	context.subscriptions.push(openCommand);

	
	context.subscriptions.push(
		vscode.commands.registerCommand("ClioSQL.RegisterWebApp", (args: FormData )=>{
			getClioExecutor().executeCommandByTerminal(`reg-web-app ${args.name} -u ${args.url} -l ${args.username} -p ${args.password} -m ${args.maintainer} -i ${args.isNetCore} -c ${args.isDeveloperModeEnabled} -s ${args.isSafe}`);
			envService.refresh();
	}));


	context.subscriptions.push(
		vscode.commands.registerCommand("ClioSQL.AddConnection", ()=>{
			AddConnection.createOrShow(context.extensionUri);
		})
	);

}
export function deactivate() {}
