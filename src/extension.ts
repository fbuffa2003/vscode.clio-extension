import * as vscode from 'vscode';
import { Clio } from './commands/Clio';
import { IRegisterWebAppArgs } from './commands/RegisterWebAppCommand';
import { TextEditor } from 'vscode';
import { ConnectionPanel, FormData } from './panels/ConnectionPanel';
import { ClioExecutor } from './Common/clioExecutor';
import { CreatioTreeItemProvider } from './service/TreeItemProvider/CreatioTreeItemProvider';
import { Environment, IConnectionSettings } from './service/TreeItemProvider/Environment';
import { CatalogPanel } from './panels/CatalogPanel';
import { CreatioTreeItem } from './service/TreeItemProvider/CreatioTreeItem';
import { Package, PackageList, WorkSpaceItem } from './service/TreeItemProvider/PackageList';
import { ProcessList } from './service/TreeItemProvider/ProcessList';
import { EntityList } from './service/TreeItemProvider/EntityList';
import { SqlPanel } from './panels/SqlPanel';
import { FeaturesPanel } from './panels/FeaturesPanel';
import { WebSocketMessagesPanel } from './panels/WebSocketMessagesPanel';
import { ComparePanel } from './panels/ComparePanel';
import { CreatioFS } from './file-system-provider/fileSystemProvider';
import { ItemType } from './service/TreeItemProvider/ItemType';
import { MarketplaceCatalogue } from './common/MarketplaceClient/MarketplaceCatalogue';
import { ModerationState, ProductCategory } from './common/MarketplaceClient/marketplaceApp';

export function activate(context: vscode.ExtensionContext) {
	const clio = new Clio();
	const executor = new ClioExecutor();	
	const _marketplaceCatalogue = new MarketplaceCatalogue();

	//#region FileSystemProvider
	const creatioFS = new CreatioFS();
	const registration = vscode.workspace.registerFileSystemProvider("creatio", creatioFS, {
		isCaseSensitive : true,
		isReadonly : false
	});
	context.subscriptions.push(registration);

	let initialized = false;
	
	context.subscriptions.push(vscode.commands.registerCommand("creatioFS/getFile", _=>{
		//const file_uri = vscode.Uri.parse(`creatio:/environment-name/afile.cs`);
		const file_uri = vscode.Uri.parse(`creatio:/environment-name/afile.cs?uid=$some-guid-here&itemType=some-type-here`);
		vscode.workspace.openTextDocument(file_uri)
		.then((doc: vscode.TextDocument)=>{
			vscode.window.showTextDocument(doc);
		});
	}));

	context.subscriptions.push(vscode.commands.registerCommand('creatioFS.workspaceInit', _ => {
		vscode.workspace.updateWorkspaceFolders(
			0, 
			0, 
			{ uri: vscode.Uri.parse('creatio:/'), 
			name: "creatioFS - Sample" });
	}));


	//#endregion

	const treeProvider = new CreatioTreeItemProvider();
	//vscode.window.registerTreeDataProvider('vscode-clio-extension.creatioExplorer', treeProvider);
	const treeView = vscode.window.createTreeView("vscode-clio-extension.creatioExplorer", {
		treeDataProvider: treeProvider
	});

	treeView.onDidCollapseElement(async (event: vscode.TreeViewExpansionEvent<CreatioTreeItem>) => {
		if(event.element instanceof PackageList){
			//TODO: Change to clio when available
			//await (event.element as PackageList).getPackages()
			(event.element as PackageList).items = [];
			treeProvider.refresh();
		}
	});
	
	treeView.onDidChangeSelection(async (event: vscode.TreeViewSelectionChangeEvent<CreatioTreeItem>)=>{
		
	});

	treeView.onDidExpandElement(async (event: vscode.TreeViewExpansionEvent<CreatioTreeItem>)=>{
		if(event.element instanceof Environment){
			creatioFS.addClient({
				client: event.element.creatioClient,
				name : event.element.label
			});
			return;
		}
		
		if(event.element instanceof PackageList){
			vscode.window.withProgress(
				{
					location : vscode.ProgressLocation.Notification,
					title: "Getting packages data"
				},
				async(progress, token)=>{
					await (event.element as PackageList).getPackagesDev();
					treeProvider.refresh();
					
					const packages = (event.element.items as Package[]);
					packages.forEach((p, index)=>{

						const u = vscode.Uri.parse(`creatio:/${event.element.parent?.label}/${p.name}`);
						creatioFS.createDirectory(u);
					});

					progress.report({
						increment: 100,
						message: "Done"
					});
				}
			);
		}


		if(event.element instanceof Package){

			console.log("Package expanded");
			const creatioPackage = event.element as Package;
			const items = creatioPackage.items as WorkSpaceItem[];

			items.forEach((item)=>{
				
				switch(item.itemType){
					case ItemType.clientModuleSchema:
						const jsFileName = item.name+'.js';
						const jsFileUri = vscode.Uri.parse(`creatio:/${creatioPackage.parent?.parent?.label}/${creatioPackage.name}/${jsFileName}`);
						creatioFS.writeFile(jsFileUri, new Uint8Array(0), {create:true, overwrite:true, isInit: true, itemType: item.itemType});
						break;
					
					case ItemType.sourceCodeSchema:
						const csFileName = item.name+'.cs';
						const csFileUri = vscode.Uri.parse(`creatio:/${creatioPackage.parent?.parent?.label}/${creatioPackage.name}/${csFileName}`);
						creatioFS.writeFile(csFileUri, new Uint8Array(0), {create:true, overwrite:true, isInit: true, itemType: item.itemType});
						break;
					
					case ItemType.sqlScriptSchema:
						const sqlFileName = item.name+'.sql';
						const sqlFileUri = vscode.Uri.parse(`creatio:/${creatioPackage.parent?.parent?.label}/${creatioPackage.name}/${sqlFileName}`);
						creatioFS.writeFile(sqlFileUri, new Uint8Array(0), {create:true, overwrite:true,isInit: true, itemType: item.itemType});
						break;
				}
			});

		}
		
		if(event.element instanceof ProcessList){
			return;
		}

		if(event.element instanceof EntityList){
			return;
		}
	});

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
		//Show my panel;
		SqlPanel.render(context.extensionUri, envName as string);
		SqlPanel.currentPanel?.sendMessage(result);

		/*
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
		*/
	}));

	context.subscriptions.push(
		vscode.commands.registerCommand('ClioSQL.UpdateClioCli', async () => {
			const result = await executor.ExecuteClioCommand("dotnet tool update clio -g --no-cache");
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
	
	context.subscriptions.push(vscode.commands.registerCommand('ClioSQL.ShowFeatures', async (node: Environment) => {
		FeaturesPanel.render(context.extensionUri, node);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('ClioSQL.CompareFeatures', async (node: Environment) => {
		ComparePanel.render(context.extensionUri, node, treeProvider.environments);
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
			CatalogPanel.render(context.extensionUri, node);
		})
	);
	
	context.subscriptions.push(
		vscode.commands.registerCommand("ClioSQL.DownloadPackage", async (node: Package)=>{
			node.download();
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand("ClioSQL.Listen", (node: Environment)=>{
			//node.Listen();
			WebSocketMessagesPanel.render(context.extensionUri, node);
		})
	);

	//#endregion

	//#region Commands : Package
	context.subscriptions.push(
		vscode.commands.registerCommand("ClioSQL.UnlockPackage", async (node: Package)=>{
			await node.unlock();
			treeProvider.refresh();
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand("ClioSQL.LockPackage", async (node: Package)=>{
			await node.lock();
			treeProvider.refresh();
		})
	);
	//#endregion

	//#region Commands : schema
	context.subscriptions.push(
		vscode.commands.registerCommand("ClioSQL.ShowSchemaContent", async (node: WorkSpaceItem)=>{
			node.showContent();
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand("ClioSQL.OpenSchemaContent", async (node: WorkSpaceItem)=>{
			node.showContent();
		})
	);
	//#endregion

	//#region Experemental
	context.subscriptions.push(
		vscode.commands.registerCommand("ClioSQL.GetCatalogue", async ()=>{
			await _marketplaceCatalogue.FillCatalogueAsync();
			
			const apps = _marketplaceCatalogue.Applications.filter(app=>app.moderationState === ModerationState.published);
			await apps[0].FillAllPropertiesAsync();
			const app = apps[0];

			console.log(`Title: ${app.title}`);
			console.log(`Languages: ${app.AppLanguages}`);
			console.log(`Certified: ${app.isCertified}`);
			console.log(`MarketplaceUrl: ${app.MarketplaceUrl.toString()}`);
			console.log(`Product Category: ${ProductCategory[app.AppProductCategory]}`);
			console.log(`Application Map: ${app.ApplicationMap}`);
			console.log(`Compatibility: ${app.AppCompatibility}`);
			console.log(`Compatible Version: ${app.AppCompatibilityVersion}`);
			console.log(`Compatible dbms: ${app.AppCompatibleDbms}`);
			console.log(`Compatible platform: ${app.AppCompatiblePlatform}`);
			console.log(`Developer: ${app.AppDeveloper}`);
			
			console.log(`Logo: ${app.AppLogo}`);
		})
	);
	//#endregion

}
export function deactivate() {}
