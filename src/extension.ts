import * as vscode from 'vscode';
import {CreatioInstance, EnvironmentService, HealthStatus} from './service/environmentService';
import { AddConnection, FormData } from './panels/AddConnection';
import {ClioExecutor} from './Common/clioExecutor';
import { exec } from 'child_process';
import { writeFileSync, rmSync } from 'fs';
import getAppDataPath from 'appdata-path';
import path = require('path');
import { randomUUID } from 'crypto';

// let terminal: vscode.Terminal | undefined;
let clioExecutor : ClioExecutor | undefined;

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
	
	const executeSqlCommand = vscode.commands.registerCommand('ClioSQL.ExecuteSql', async (node: vscode.TextDocument) => {
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
		const result = await envService.findInstanceByName(envName)?.executeSql(sqlCmd);
		vscode.workspace.openTextDocument({
				language: 'text',
				content: result
			})
			.then(doc => {
				vscode.window.showTextDocument(doc, {
					viewColumn: vscode.ViewColumn.Beside
				});
			});
	});
	context.subscriptions.push(executeSqlCommand);
	

	context.subscriptions.push( 
		vscode.commands.registerCommand('ClioSQL.restart', async (node: CreatioInstance) => {
			if(node){
				await node.restartWebApp();
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('ClioSQL.flushDb', async (node: CreatioInstance) => {
			if(node){
				await node.flushDb();
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('ClioSQL.Open', async (node: CreatioInstance) => {
			if(node){
				await node.openInBrowser();
			}
		})
	);
	
	context.subscriptions.push(
		vscode.commands.registerCommand("ClioSQL.RegisterWebApp", async (args: FormData )=>{
			const cmd = ` clio reg-web-app ${args.name} -u ${args.url} -l ${args.username} -p ${args.password} -m ${args.maintainer} -i ${args.isNetCore} -c ${args.isDeveloperModeEnabled} -s ${args.isSafe}`;
			exec(cmd, (error, stdout, stderr )=>{
				if(error){
					vscode.window.showErrorMessage(error.message, "OK")
					.then(answer => {
						AddConnection.kill();
					});
				}
				if(stdout){
					envService.addNewNode(new CreatioInstance(args.name, args.url, vscode.TreeItemCollapsibleState.Collapsed));
					AddConnection.kill();
				}
			});
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('ClioSQL.HealthCheck', async (node: CreatioInstance) => {
			if(node){
				await node.checkHealth();
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("ClioSQL.AddConnection", ()=>{
			AddConnection.createOrShow(context.extensionUri);
		})
	);

}
export function deactivate() {}
