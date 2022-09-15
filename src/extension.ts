import * as vscode from 'vscode';
import {EnvironmentService, HealthStatus} from './service/environmentService';
import { CreatioInstance } from "./service/CreatioInstance";
import { AddConnection, FormData } from './panels/AddConnection';
import {ClioExecutor} from './Common/clioExecutor';
import { exec } from 'child_process';
import { writeFileSync, rmSync } from 'fs';
import getAppDataPath from 'appdata-path';
import path = require('path');
import { randomUUID } from 'crypto';
import { InstallMarketplaceApp } from './panels/MarketplaceApp';
import { Clio } from './commands/Clio';
import { IFlushDbArgs } from './commands/FlushDbCommand';
import { resourceLimits } from 'worker_threads';
import { IRegisterWebAppArgs } from './commands/RegisterWebAppCommand';
import { TextEditor } from 'vscode';

// let terminal: vscode.Terminal | undefined;
let clioExecutor : ClioExecutor | undefined;

function getClioExecutor(): ClioExecutor {
	if(clioExecutor){
		return clioExecutor;
	}
	return clioExecutor = new ClioExecutor();
}

export function activate(context: vscode.ExtensionContext) {
	const clio = new Clio();
	const envService = new EnvironmentService();
	vscode.window.registerTreeDataProvider('vscode-clio-extension.creatioExplorer', envService);

	let showSqlDocument = vscode.commands.registerCommand('ClioSQL.OpenSqlDocument', (node: vscode.TreeItem) => {
		vscode.workspace.openTextDocument({
			language: 'sql',
			content: `-- connection_env:${node.label}\r\n`
		}).then(doc=>{
			let w = vscode.window.showTextDocument(doc).then((textEditor: TextEditor) => {
				const lineNumber = 1;
				const characterNumberOnLine = 1;
				const position = new vscode.Position(lineNumber, characterNumberOnLine);
				const newSelection = new vscode.Selection(position, position);
				textEditor.selection = newSelection;
			  });
			vscode.commands.executeCommand("workbench.action.editor.changeLanguageMode", "sql");
		});
	});
	context.subscriptions.push(showSqlDocument);
	
	const executeSqlCommand = vscode.commands.registerCommand('ClioSQL.ExecuteSql', async (node: vscode.TextDocument) => {
		let commandsDocument = vscode.window.activeTextEditor?.document;
		let text : String = commandsDocument?.getText() as string;
		let sqlText: String[] = text.split(/^-- connection_env:.*/, 2);
		let envName: String = "";
		let m =  text.match(/^-- connection_env:.*/);
		
		if(m){
			envName = m[0].split(':',2)[1];
		}
		if(!sqlText[1] || !envName){
			return;
		}
		const sqlCmd = sqlText[1].replace('\r','').replace('\n','').trim();		
		const result = await envService.findInstanceByName(envName)?.executeSql(sqlCmd);
		
		await vscode.commands.executeCommand("workbench.action.editorLayoutTwoRows");
				
		vscode.workspace.openTextDocument({
			language: 'text',
			content : (result|| '').toString()
		})
		.then((doc: vscode.TextDocument)=>{
			vscode.window.showTextDocument(doc, {
				viewColumn: vscode.ViewColumn.Two
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
		vscode.commands.registerCommand('ClioSQL.Unreg', async (node: CreatioInstance) => {
			if(node){
				await node.UnregWebApp();
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

			const commandArgs : IRegisterWebAppArgs ={
				url: args.url,
				username: args.username,
				password: args.password,
				maintainer: args.maintainer,
				isNetCore: args.isNetCore,
				isSafe: args.isSafe,
				isDeveloperModeEnabled: args.isDeveloperModeEnabled,
				environmentName: args.name
			};
			const isArgValid = clio.registerWebApp.canExecute(commandArgs);

			if(!isArgValid.success){
				vscode.window.showErrorMessage(isArgValid.message.toString());
			}

			const result = await clio.registerWebApp.executeAsync(commandArgs);
			if(result.success){
				envService.addNewNode(new CreatioInstance(args.name, args.url, vscode.TreeItemCollapsibleState.Collapsed));
				AddConnection.kill();
				vscode.window.showInformationMessage(result.message.toString());
			} else {
				vscode.window.showErrorMessage(result.message.toString(), "OK")
				.then(answer => {
					AddConnection.kill();
				});
			}

			

			// const cmd = ` clio reg-web-app ${args.name} -u ${args.url} -l ${args.username} -p ${args.password} -m ${args.maintainer} -i ${args.isNetCore} -c ${args.isDeveloperModeEnabled} -s ${args.isSafe}`;
			// exec(cmd, (error, stdout, stderr )=>{
			// 	if(error){
			// 		vscode.window.showErrorMessage(error.message, "OK")
			// 		.then(answer => {
			// 			AddConnection.kill();
			// 		});
			// 	}
			// 	if(stdout){
			// 		envService.addNewNode(new CreatioInstance(args.name, args.url, vscode.TreeItemCollapsibleState.Collapsed));
			// 		AddConnection.kill();
			// 	}
			// });
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
		
	context.subscriptions.push(
		vscode.commands.registerCommand("ClioSQL.InstallMarketplaceApp", ()=>{
			InstallMarketplaceApp.createOrShow(context.extensionUri);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("ClioSQL.TestCommand", async ()=>{
			const clio = new Clio();
			
			const args = {environmentName: "zoom"} as IFlushDbArgs;
			if(clio.flushDb.canExecute(args)){
				const result = await clio.flushDb.executeAsync(args);
				
				if(result.success){
					vscode.window.showInformationMessage(`Flushdb : ${result.message}`);
				} else if(!result.success){
					vscode.window.showErrorMessage(`Flushdb : ${result.message}`);
				}
			}
		})
	);

}
export function deactivate() {}
