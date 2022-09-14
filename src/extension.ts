import * as vscode from 'vscode';
import { fileURLToPath } from 'url';
import {CreatioInstance, EnvironmentService, HealthStatus} from './service/environmentService';
import { AddConnection, FormData } from './pannels/AddConnection';
import {ClioExecutor} from './Common/clioExecutor';
import { exec, spawn, ChildProcess } from 'child_process';
import { cpSync } from 'fs';
import { DiffieHellman } from 'crypto';


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


	let showSqlDocument = vscode.commands.registerCommand('ClioSQL.OpenSqlDocument', (node: vscode.TreeItem) => {
		vscode.workspace.openTextDocument({
			language: 'sql',
			content: `-- connection_env:${node.label}`
		}).then(doc=>{
			let w = vscode.window.showTextDocument(doc);
			vscode.commands.executeCommand("workbench.action.editor.changeLanguageMode", "sql");
		});
	});
	context.subscriptions.push(showSqlDocument);
	let disposable = vscode.commands.registerCommand('ClioSQL.ExecuteSql', (node: vscode.TreeItem) => {
		let commandsDocument = vscode.window.activeTextEditor?.document;
		let text : string = commandsDocument?.getText() as string;
		let sqlText: string[] = text.split(/^-- connection_env:.*/, 2);
		let envName: string = "";
		let m =  text.match(/^-- connection_env:.*/);
		
		if(m){
			envName = m[0].split(':',2)[1];
		}
		if(!sqlText[1] || !envName){
			return;
		}
		const sqlCmd = sqlText[1].replace('\r','').replace('\n','').trim();
		const cmd = `clio sql "${sqlCmd}" -e ${envName}`;
		exec(cmd, (error, stdout, stderr )=>{
			if(error){
				vscode.window.showErrorMessage(error.message);
			}
			if(stdout){
				vscode.workspace.openTextDocument({
					language: 'text',
					content: stdout
				}).then(doc=>{
					vscode.window.showTextDocument(doc,{
						viewColumn: vscode.ViewColumn.Beside
					});
				});
			}
			if(stderr){
				vscode.window.showErrorMessage(stderr);
			}
		});
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

	// HealthCheck Command
	context.subscriptions.push(
		vscode.commands.registerCommand('ClioSQL.HealthCheck', async (node: CreatioInstance) => {
			if(!node.label){
				return;
			}
			await envService.updateNode(node);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("ClioSQL.AddConnection", ()=>{
			AddConnection.createOrShow(context.extensionUri);
		})
	);

}
export function deactivate() {}
