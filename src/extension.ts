import * as vscode from 'vscode';
import { InstallMarketplaceApp } from './panels/MarketplaceApp';
import { Clio } from './commands/Clio';
import { IRegisterWebAppArgs } from './commands/RegisterWebAppCommand';
import { TextEditor } from 'vscode';
import { ConnectionPanel, FormData } from './panels/ConnectionPanel';
import { ClioExecutor } from './Common/clioExecutor';
import { CreatioTreeItemProvider } from './service/TreeItemProvider/CreatioTreeItemProvider';
import { Environment, IConnectionSettings } from './service/TreeItemProvider/Environment';
import { CatalogPanel } from './panels/CatalogPanel';


export function activate(context: vscode.ExtensionContext) {
	const clio = new Clio();
	const executor = new ClioExecutor();

	const treeProvider = new CreatioTreeItemProvider();
	vscode.window.registerTreeDataProvider('vscode-clio-extension.creatioExplorer', treeProvider);

	context.subscriptions.push(vscode.commands.registerCommand('ClioSQL.ExecuteSql', async (doc) => {
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
		const result = await treeProvider.findInstanceByName(envName)?.executeSql(sqlCmd);
		
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
	}));

	context.subscriptions.push(
		vscode.commands.registerCommand('ClioSQL.UpdateClioCli', async () => {
			const result = await executor.ExecuteClioCommand("dotnet tool update clio -g");
			vscode.window.showInformationMessage(result as string);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('ClioSQL.UninstallClioCli', async () => {
			const result = await executor.ExecuteClioCommand("dotnet tool uninstall clio -g");
			vscode.window.showInformationMessage(result as string);
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
				return;
			}

			const result = await clio.registerWebApp.executeAsync(commandArgs);
			if(result.success){
				treeProvider.addNewNode(args.name, {
					uri: new URL(args.url),
					login: args.username,
					password: args.password,
					maintainer: args.maintainer,
					isNetCore: args.isNetCore,
					isSafe: args.isSafe,
					isDeveloperMode: args.isDeveloperModeEnabled
				} as IConnectionSettings);

				ConnectionPanel.kill();
				vscode.window.showInformationMessage(result.message.toString());
			} else {
				treeProvider.addNewNode(args.name, {
					uri: new URL(args.url),
					login: args.username,
					password: args.password,
					maintainer: args.maintainer,
					isNetCore: args.isNetCore,
					isSafe: args.isSafe,
					isDeveloperMode: args.isDeveloperModeEnabled
				} as IConnectionSettings);
				vscode.window.showErrorMessage(result.message.toString(), "OK")
				.then(answer => {
					ConnectionPanel.kill();
				});
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("ClioSQL.AddConnection", ()=>{
			ConnectionPanel.render(context.extensionUri);
		})
	);


	//#region Commands : Environment

	context.subscriptions.push(vscode.commands.registerCommand('ClioSQL.OpenSqlDocument', (node: Environment) => {
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
	}));
	
	context.subscriptions.push( 
		vscode.commands.registerCommand('ClioSQL.restart', async (node: Environment) => {
			vscode.window
				.showWarningMessage("Would you like to restart environment \"" + node.label + "\"?", "Yes", "No",)
				.then(answer => {
					if (answer === "Yes") {
						if(node){
							node.restartWebApp();
						}
					}
				});
		})
	);

	context.subscriptions.push( 
		vscode.commands.registerCommand('ClioSQL.UnregisterWebApp', async (node: Environment) => {
			vscode.window
				.showWarningMessage("Would you like to delete environment \"" + node.label + "\"?", "Yes", "No",)
				.then(answer => {
					if (answer === "Yes") {
						if(node){node.unregisterWebApp();}
					}
				});
			})
	);

	context.subscriptions.push( 
		vscode.commands.registerCommand('ClioSQL.RestoreConfiguration', async (node: Environment) => {
			vscode.window
				.showWarningMessage("Would you like to restore configuration \"" + node.label + "\"?", "Yes", "No",)
				.then(answer => {
					if (answer === "Yes") {
						if(node){node.restoreConfiguration();}
					}
				});
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('ClioSQL.flushDb', async (node: Environment) => {
			vscode.window
				.showWarningMessage("Would you like to flush redis db on environment \"" + node.label + "\"?", "Yes", "No",)
				.then(answer => {
					if (answer === "Yes") {
						if(node){
							node.flushDb();
						}
					}
				});
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('ClioSQL.Open', async (node: Environment) => {
			if(node){
				await node.openInBrowser();
			}
		})
	);
	
	context.subscriptions.push(
		vscode.commands.registerCommand('ClioSQL.InstallPackage', async (node: Environment) => {
			
			const options: vscode.OpenDialogOptions = {
				canSelectMany: false,
				openLabel: 'Select Creatio package',
				filters: {
					'creatioPackages': ['gz', 'zip'],
					'allFiles': ['*']
				}
			};
		
			vscode.window.showOpenDialog(options).then(fileUri => {
				if (fileUri && fileUri[0]) {
					var filePath = fileUri[0].fsPath;
					if(node){
						node.installPackage(filePath);
					}
				}
			});
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('ClioSQL.InstallGate', async (node: Environment) => {
			vscode.window
				.showInformationMessage("Would you like to install clio api on environment \"" + node.label + "\"?", "Yes", "No",)
				.then(answer => {
					if (answer === "Yes") {
						if(node){
							node.installGate();
						}
					}
				});
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('ClioSQL.HealthCheck', async (node: Environment) => {
			if(node){
				await node.checkHealth();
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("ClioSQL.InstallMarketplaceApp", async (node: Environment)=>{
			//InstallMarketplaceApp.createOrShow(context.extensionUri);
			CatalogPanel.render(context.extensionUri, node);
			CatalogPanel.currentPanel?.sendMessage();
		})
	);

	//#endregion
}
export function deactivate() {}
