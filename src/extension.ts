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
import { NugetClient } from './common/NugetClient/NugetClient';
import { mySemVer } from './utilities/mySemVer';
import { RequiredFeatures } from './common/WindowsOptionalFeature';
import { installer } from './common/installer';
import { instalationInpitValidator } from './common/InputValidator/instalationInpitValidator';
import * as fs from 'node:fs/promises';
import * as fss from 'fs';
import { PowerShell } from 'node-powershell/dist';
import { decompressor } from './common/TemplateWorker/decompressor';
import { Workspace, WorkspaceTreeViewProvider } from './service/workspaceTreeViewProvider/WorkspaceTreeViewProvider';
import path = require('path');
import getAppDataPath from 'appdata-path';


/**
 * Main entry point into the extension.
 * @param context - ext context, will be given by vscode runtime
 */
export function activate(context: vscode.ExtensionContext) {
	
	const executor : ClioExecutor = new ClioExecutor();
	const nugetClient : NugetClient = new NugetClient();
	const treeProvider = new CreatioTreeItemProvider();
	const clio = new Clio();
	const _marketplaceCatalogue = new MarketplaceCatalogue();
	const _emptyFormData: FormData = {
		name: "",
		url : "",
		username: "",
		password: "",
		maintainer: "",
		isNetCore: false,
		isSafe: false,
		isDeveloperModeEnabled: false,
		clientId: "",
		clientSecret: ""
	};

	//#region Environments

	function handleUpdateNode(instance: CreatioTreeItem):void {
		treeProvider.environments = environments.sort((a,b) => 0 - (a.label.toLowerCase() > b.label.toLowerCase() ? -1 : 1));
		treeProvider.refresh();
	}
	function handleDeleteNode(instance: CreatioTreeItem):void {

		const removedInstance = environments.find(i=> i.label === instance.label);
		if (removedInstance) {
			var removedIndex = environments.indexOf(removedInstance);
			environments.splice(removedIndex,1);
		}
		treeProvider.environments = environments.sort((a,b) => 0 - (a.label.toLowerCase() > b.label.toLowerCase() ? -1 : 1));
		treeProvider.refresh();
	}

	function getClioEnvironments() : Map<string, IConnectionSettings> {
		const _filePath : string = getAppDataPath() + "\\..\\Local\\creatio\\clio\\appsettings.json";
		let _fileExists : boolean = fss.existsSync(_filePath);
		
		if(!_fileExists){
			return new Map<string, IConnectionSettings>();
		}
		const file = fss.readFileSync(
			path.join(_filePath),
			{
				encoding: "utf-8"
			}
		);

		const json = JSON.parse(file);
		const environments = json['Environments'];
		let keys : string[] = [];
		Object.keys(environments).forEach(key =>{
			keys.push(key);
		});

		const map = new Map<string, IConnectionSettings>();

		keys.forEach(key=>{
			type ObjectKey = keyof typeof environments;
			const keyName = key as ObjectKey;
			const environment = environments[keyName];

			const env : IConnectionSettings = {
				uri: new URL(environment['Uri']),
				login: environment['Login'] ?? '',
				password: environment['Password'] ?? '',
				maintainer: environment['Maintainer'] ?? '',
				isNetCore: environment['IsNetCore'] ?? false,
				isSafe: environment['Safe'] ?? false,
				isDeveloperMode: environment['DeveloperModeEnabled'],
				oauthUrl: environment['AuthAppUri'] !== undefined ? new URL(environment['AuthAppUri']) : undefined,
				clientId: environment['ClientId'] !== undefined ? environment['ClientId'] : undefined,
				clientSecret: environment['ClientSecret'] !== undefined ? environment['ClientSecret'] : undefined
			};
			map.set(keyName as string, env);
		});
		return map;
	}

	function CreateEnvironments(): Array<Environment>{
		const _environments = new Array<Environment>();
		const map = getClioEnvironments();
		for (let [key, value] of map.entries()) {
			const instance = new Environment(key, value);

			instance.onDidStatusUpdate((instance: CreatioTreeItem)=>{
				handleUpdateNode(instance);
			});

			instance.onDeleted((instance: CreatioTreeItem)=>{
				handleDeleteNode(instance);
			});
			_environments.push(instance);
		}
		return _environments.sort((a,b) => 0 - (a.label.toLowerCase() > b.label.toLowerCase() ? -1 : 1));
	}

	let environments : Array<Environment> = CreateEnvironments();

	//TODO: this wont work on Mac + Linux. Should query clio for path
	function watchFileChange(){
		const parts = path.parse(getAppDataPath()).dir.split('\\');
		const myPath = `${parts[0]}\\${parts[1]}\\${parts[2]}\\${parts[3]}\\Local\\creatio\\clio`;
		const appsettingsFolderPath = vscode.Uri.file(myPath);
		const watcher = vscode.workspace.createFileSystemWatcher(
			new vscode.RelativePattern(appsettingsFolderPath, "appsettings.json"), 
			false, false, false);
		
		watcher.onDidCreate(uri => {
			environments = CreateEnvironments();
			treeProvider.environments = environments;
			treeProvider.refresh();
		});
		watcher.onDidChange((uri: vscode.Uri) => {
			environments = CreateEnvironments();
			treeProvider.environments = environments;
			treeProvider.refresh();
		});
		watcher.onDidDelete(uri => {
			environments = CreateEnvironments();
			treeProvider.environments = environments;
			treeProvider.refresh();
		});
	}
	watchFileChange();

	treeProvider.environments = environments;

	//#endregion

	//Check clio latest version!
	checkClioLatestVersion(nugetClient, executor);
	// (async()=>{
	// 	await forceUpdateClio(executor);
	// })();
	
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

	//#region TreeView
	const treeView = vscode.window.createTreeView("vscode-clio-extension.creatioExplorer", {
		treeDataProvider: treeProvider
	});

	treeView.onDidCollapseElement(async (event: vscode.TreeViewExpansionEvent<CreatioTreeItem>) => {
		if(event.element instanceof PackageList){
			treeProvider.refresh();
		}
	});
	
	treeView.onDidChangeSelection(async (event: vscode.TreeViewSelectionChangeEvent<CreatioTreeItem>)=>{});

	treeView.onDidExpandElement(async (event: vscode.TreeViewExpansionEvent<CreatioTreeItem>)=>{
		if(event.element instanceof Environment){
			creatioFS.addClient({
				client: event.element.creatioClient,
				name : event.element.label
			});
			return;
		}
		
		if(event.element instanceof PackageList && !(event.element as PackageList).isPackageRetrievalInProgress && (event.element as PackageList).items.length === 0){

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
			//console.log("Package expanded");
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
	//#endregion

	//#region Commands : Environment

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
		})
	);

	context.subscriptions.push(vscode.commands.registerCommand('ClioSQL.UpdateClioCli', async () => {
			const result = await executor.ExecuteClioCommand("dotnet tool update clio -g --no-cache");
			vscode.window.showInformationMessage(result as string);
		})
	);

	context.subscriptions.push(vscode.commands.registerCommand('ClioSQL.UninstallClioCli', async () => {
			const result = await executor.ExecuteClioCommand("dotnet tool uninstall clio -g");
			vscode.window.showInformationMessage(result as string);
		})
	);

	context.subscriptions.push(vscode.commands.registerCommand("ClioSQL.RegisterWebApp", async (args: FormData)=>{

			const commandArgs : IRegisterWebAppArgs ={
				url: args.url,
				username: args.username,
				password: args.password,
				maintainer: args.maintainer,
				isNetCore: args.isNetCore,
				isSafe: args.isSafe,
				isDeveloperModeEnabled: args.isDeveloperModeEnabled,
				environmentName: args.name,
				clientId : args.clientId,
				clientSecret : args.clientSecret

			};
			const isArgValid = clio.registerWebApp.canExecute(commandArgs);
			if(!isArgValid.success){
				vscode.window.showErrorMessage(isArgValid.message.toString());
				return;
			}
			const result = await clio.registerWebApp.executeAsync(commandArgs);		
			const newEnv = new Environment(args.name, {
				uri: new URL(args.url),
				login: args.username,
				password: args.password,
				maintainer: args.maintainer,
				isNetCore: args.isNetCore,
				isSafe: args.isSafe,
				isDeveloperMode: args.isDeveloperModeEnabled,
				clientId : args.clientId,
				clientSecret : args.clientSecret
			} as IConnectionSettings);

			newEnv.onDidStatusUpdate((instance: CreatioTreeItem)=>{
				handleUpdateNode(instance);
			});

			newEnv.onDeleted((instance: CreatioTreeItem)=>{
				handleDeleteNode(instance);
			});

			environments.push(newEnv);
			treeProvider.environments = environments.sort((a,b) => 0 - (a.label.toLowerCase() > b.label.toLowerCase() ? -1 : 1));
			treeProvider.refresh();
			
			// treeProvider.addNewNode(args.name, {
			// 	uri: new URL(args.url),
			// 	login: args.username,
			// 	password: args.password,
			// 	maintainer: args.maintainer,
			// 	isNetCore: args.isNetCore,
			// 	isSafe: args.isSafe,
			// 	isDeveloperMode: args.isDeveloperModeEnabled,
			// 	clientId : args.clientId,
			// 	clientSecret : args.clientSecret
			// } as IConnectionSettings);	

			if(result.success){
				ConnectionPanel.kill();
				vscode.window.showInformationMessage(result.message.toString());
			} else {
				vscode.window.showErrorMessage(result.message.toString(), "OK")
				.then(answer => {
					ConnectionPanel.kill();
				});
			}
		})
	);

	context.subscriptions.push(	vscode.commands.registerCommand("ClioSQL.AddConnection", ()=>{
			ConnectionPanel.render(context.extensionUri, _emptyFormData, false, undefined);
		})
	);

	context.subscriptions.push(vscode.commands.registerCommand("ClioSQL.RefreshConnection", async (node: WorkSpaceItem)=>{
		environments =  CreateEnvironments();
		treeProvider.environments = environments;
		treeProvider.refresh();
	}));

	context.subscriptions.push(vscode.commands.registerCommand("ClioSQL.Settings", async (node: Environment)=>{
			executor.executeCommandByTerminal(`cfg open`);
		})
	);

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

	context.subscriptions.push(vscode.commands.registerCommand('ClioSQL.restart', async (node: Environment) => {
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

	context.subscriptions.push(vscode.commands.registerCommand('ClioSQL.UnregisterWebApp', async (node: Environment) => {
			vscode.window
				.showWarningMessage("Would you like to delete environment \"" + node.label + "\"?", "Yes", "No",)
				.then(answer => {
					if (answer === "Yes") {
						if(node){node.unregisterWebApp();}
					}
				});
			})
	);

	context.subscriptions.push(vscode.commands.registerCommand('ClioSQL.RestoreConfiguration', async (node: Environment) => {
			vscode.window.showWarningMessage("Would you like to restore configuration \"" + node.label + "\"?", "Yes", "No",)
				.then(answer => {
					if (answer === "Yes") {
						if(node){node.restoreConfiguration();}
					}
				}
			);
		})
	);

	context.subscriptions.push(vscode.commands.registerCommand('ClioSQL.flushDb', async (node: Environment) => {
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

	context.subscriptions.push(vscode.commands.registerCommand('ClioSQL.Open', async (node: Environment) => {
			if(node){
				await node.openInBrowser();
			}
		})
	);
	
	context.subscriptions.push(vscode.commands.registerCommand('ClioSQL.EditConnection', async (node: Environment) => {
			const connectionSettings = node.connectionSettings;
			const formData: FormData = {
				name: node.label ?? "",
				url : connectionSettings.uri.toString(),
				username: connectionSettings.login ?? "",
				password: connectionSettings.password ?? "",
				maintainer: connectionSettings.maintainer ?? "",
				isNetCore: connectionSettings.isNetCore,
				isSafe: connectionSettings.isSafe,
				isDeveloperModeEnabled: connectionSettings.isDeveloperMode  ?? false,
				clientId: connectionSettings.clientId ?? "",
				clientSecret: connectionSettings.clientSecret ?? ""
			};

			const editEnv = environments.find(e=> e.label === node.label);
			if(editEnv){
				ConnectionPanel.kill();
				ConnectionPanel.render(context.extensionUri, formData, true, editEnv);
			}
		})
	);

	context.subscriptions.push(vscode.commands.registerCommand('ClioSQL.InstallPackage', async (node: Environment) => {
			
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

	context.subscriptions.push(vscode.commands.registerCommand('ClioSQL.InstallGate', async (node: Environment) => {
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

	context.subscriptions.push(vscode.commands.registerCommand('ClioSQL.HealthCheck', async (node: Environment) => {
			if(node){
				await node.checkHealth();
			}
		})
	);

	context.subscriptions.push(vscode.commands.registerCommand("ClioSQL.InstallMarketplaceApp", async (node: Environment)=>{
			CatalogPanel.render(context.extensionUri, node);
		})
	);
	
	context.subscriptions.push(vscode.commands.registerCommand("ClioSQL.DownloadPackage", async (node: Package)=>{
			node.download();
		})
	);
	
	context.subscriptions.push(vscode.commands.registerCommand("ClioSQL.Listen", (node: Environment)=>{
			//node.Listen();
			WebSocketMessagesPanel.render(context.extensionUri, node);
		})
	);
	
	context.subscriptions.push(vscode.commands.registerCommand("ClioSQL.RefreshPackages", (node: PackageList)=>{
			if(!node.isPackageRetrievalInProgress){
				node.items = new Array<Package>();
				vscode.window.withProgress(
					{
						location : vscode.ProgressLocation.Notification,
						title: "Getting packages data"
					},
					async(progress, token)=>{
						await node.getPackagesDev();
						treeProvider.refresh();
						
						const packages = (node.items as Package[]);
						packages.forEach((p, index)=>{
	
							const u = vscode.Uri.parse(`creatio:/${node.parent?.label}/${p.name}`);
							creatioFS.createDirectory(u);
						});
	
						progress.report({
							increment: 100,
							message: "Done"
						});
					}
				);
			}
			
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

	//#region Experimental

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

	context.subscriptions.push(
		vscode.commands.registerCommand("ClioSQL.WinFeatureTest", async (node: WorkSpaceItem)=>{
			var rf = new RequiredFeatures();
			rf.Items.forEach(async(feature)=>{
				
				await feature.describeAsync();
				if(!feature.IsEnabled){
					console.log(`Feature ${feature.FeatureName}: ${feature.DisplayName} is Enabled: ${feature.IsEnabled}`);
					await feature.enableAsync();
				}
			});
			console.log(`Feature check completed`);
		})
	);
	
	context.subscriptions.push(
		vscode.commands.registerCommand("ClioSQL.CopyScripts", async (node: WorkSpaceItem)=>{
			const infrastructure = vscode.Uri.joinPath(context.extensionUri, "resources","scripts", "infrastructure");
			const configuration = vscode.workspace.getConfiguration();
			const deployFolder = configuration.get<string>("k8s.workloads") ?? '';

			let exists = false;
			try {
				const dFolder = await fs.stat(deployFolder);
				if(dFolder.isDirectory()){
					exists = true;
				}
				
			} catch (error) {
				await fs.mkdir(deployFolder);
			}
			await fs.cp(infrastructure.fsPath, deployFolder,{recursive:true});
		})
	);
	
	context.subscriptions.push(
		vscode.commands.registerCommand("ClioSQL.InstallCreatio", async (node: WorkSpaceItem)=>{

			const uiPrompt = new UIPrompt();
			const foldername = await uiPrompt.getFolder();
			const appName = await uiPrompt.getAppName();
			const iis_port = await uiPrompt.getIISPortNumber();
			const redis_dbNum = await uiPrompt.getRedisDbNumber();


			const choice = await vscode.window.showInformationMessage(
				`We will install ${foldername}\n, name it ${appName}, expose it on port ${iis_port} with redisdb ${redis_dbNum}`
				, "INSTALL"
				,"ABORT");

			if(choice === "ABORT"){
				return;
			}
			const inst = new installer(appName, foldername, iis_port, redis_dbNum);
			
			try{
				await inst.renameTemplateAsync();
			}
			catch(error) {
				const errorCode = ((error as object) as any)['code'];
				if(errorCode === 'ENOENT' ){
					await inst.createTemplateDirectory();
					await inst.renameTemplateAsync();
				}
			}

			await inst.createDbFromTemplateAsync();
			vscode.window.showInformationMessage("Restore db from template completed");
			await inst.updateConnectionString();
			vscode.window.showInformationMessage("Update connection string completed");
			await inst.createIISSiteAsync();
			vscode.window.showInformationMessage("Create IIS completed");
		
			const url = `http://localhost:${iis_port}`;
			vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(url));
		
			vscode.window.withProgress(
				{
					location : vscode.ProgressLocation.Notification,
					title: "Creating new template folder"
				},
				async(progress, token)=>{
					await inst.createTemplateDirectory();
					progress.report({
						increment: 100,
						message: "Done"
					});
				}
			);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("ClioSQL.DeployInfrastructure", async (node: WorkSpaceItem)=>{
			
			const configuration = vscode.workspace.getConfiguration();
			const deployFolder = configuration.get<string>("k8s.workloads") ?? '';
			const ns = vscode.Uri.joinPath(vscode.Uri.file(deployFolder), "creatio-namespace.yaml");
			const pgadmin = vscode.Uri.joinPath(vscode.Uri.file(deployFolder), "pgadmin");
			const postgres = vscode.Uri.joinPath(vscode.Uri.file(deployFolder), "postgres");
			const redis = vscode.Uri.joinPath(vscode.Uri.file(deployFolder), "redis");

			//console.log(`kubectl apply -f ${ns.fsPath}`);
			
			await PowerShell.$`kubectl apply -f ${ns.fsPath}`;
			await PowerShell.$`kubectl apply -f ${pgadmin.fsPath}`;
			await PowerShell.$`kubectl apply -f ${postgres.fsPath}`;
			await PowerShell.$`kubectl apply -f ${redis.fsPath}`;
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("ClioSQL.PrepareTemplateFromZip", async (node: WorkSpaceItem)=>{
			
			const configuration = vscode.workspace.getConfiguration();
			const deployFolder = configuration.get<string>("archivePath");

			if(!deployFolder){
				vscode.window.showErrorMessage("archivePath cannot be empty, check your preferences");
				return;
			}

			const options : vscode.OpenDialogOptions = {
				canSelectFiles: true,
				canSelectFolders: false,
				canSelectMany: false,
				defaultUri: vscode.Uri.file(deployFolder),
				filters : {
					'Archives': ['zip']
				}
			};
			const selectedFileUri = await vscode.window.showOpenDialog(options);
			
			if(!selectedFileUri || !selectedFileUri[0]){
				vscode.window.showErrorMessage("You have to select one zip file");
				return;
			}
			const dc = new decompressor(selectedFileUri[0]);


			vscode.window.withProgress(
				{
					location : vscode.ProgressLocation.Notification,
					title: "Prepare template from Zip"
				},
				async(progress, token)=>{
					await dc.Execute(progress);
				}
			);
		})
	);
	//#endregion

	//#region Workspace : Registration
	
	const _workspaceTreeViewProvider = new WorkspaceTreeViewProvider(vscode.workspace.workspaceFolders);
	vscode.workspace.onDidChangeWorkspaceFolders(async(event: vscode.WorkspaceFoldersChangeEvent)=>{
		console.info('folder added');
		if(vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0){
			_workspaceTreeViewProvider.updateWorkspaceRoot(vscode.workspace.workspaceFolders);
		}
		return;
	});
	
	const workspaceTreeView = vscode.window.createTreeView("clio.workspaces", {
		treeDataProvider : _workspaceTreeViewProvider,
		showCollapseAll: true,
		canSelectMany: true	
	});
	
	if(vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length>0){
		workspaceTreeView.message = `Workspaces derived from folder ${vscode.workspace.workspaceFolders[0].uri.fsPath}`;
	}else{
		workspaceTreeView.message = `Workspaces derived from folder`;
	}
	workspaceTreeView.description = "Its a description, do I need it?";

	//#endregion

	//#region Workspaces : Commands
	context.subscriptions.push(vscode.commands.registerCommand("ClioSQL.createw", async (tree: vscode.TreeView<vscode.TreeItem>)=>{
			const a = tree;
		})
	);
	context.subscriptions.push(vscode.commands.registerCommand("ClioSQL.dconf", async (item: Workspace)=>{
			vscode.window.withProgress(
				{
					location : vscode.ProgressLocation.Notification,
					title: "Downloading configuration"
				},
				async(progress, token)=>{
					await item.dconf();
					progress.report({
						increment: 100,
						message: "Done"
					});
				}
			);
		})
	);
	context.subscriptions.push(vscode.commands.registerCommand("ClioSQL.pushw", async (item: Workspace)=>{
			vscode.window.withProgress(
				{
					location : vscode.ProgressLocation.Notification,
					title: "Pushing workspace"
				},
				async(progress, token)=>{
					await item.pushw();
					progress.report({
						increment: 100,
						message: "Done"
					});
				}
			);
		})
	);
	context.subscriptions.push(vscode.commands.registerCommand("ClioSQL.restorew", async (item: Workspace)=>{
			vscode.window.withProgress(
				{
					location : vscode.ProgressLocation.Notification,
					title: "Restoring workspace"
				},
				async(progress, token)=>{
					await item.restorew();
					progress.report({
						increment: 100,
						message: "Done"
					});
				}
			);
		})
	);
	context.subscriptions.push(vscode.commands.registerCommand("ClioSQL.compress", async (item: Package)=>{
			const a = item;
		})
	);
	context.subscriptions.push(vscode.commands.registerCommand("ClioSQL.openGitRepository", async (item: Workspace)=>{
			vscode.commands.executeCommand('vscode.open', item.remote);
		})
	);
	//#endregion 
	
	//#region Workspace: Tasks
	
	//open commands
	context.subscriptions.push(vscode.commands.registerCommand("ClioSQL.open-solution-framework", async (item: Workspace)=>{
			try{
				const result = await item.openSolutionFramework();
				console.info(result);
			}
			catch(error){
				vscode.window.showErrorMessage(error as string);
			}
		})
	);
	context.subscriptions.push(vscode.commands.registerCommand("ClioSQL.open-solution-framework-sdk", async (item: Workspace)=>{
			try{
				const result = await item.openSolutionFrameworkSdk();
				console.info(result);
			}
			catch(error){
				vscode.window.showErrorMessage(error as string);
			}
		})
	);
	context.subscriptions.push(vscode.commands.registerCommand("ClioSQL.open-solution-netcore", async (item: Workspace)=>{
			try{
				const result = await item.openSolutionNetcore();
				console.info(result);
			}
			catch(error){
				vscode.window.showErrorMessage(error as string);
			}
		})
	);
	context.subscriptions.push(vscode.commands.registerCommand("ClioSQL.open-solution-netcore-sdk", async (item: Workspace)=>{
		try{
			const result = await item.openSolutionNetcoreSdk();
			console.info(result);
		}
		catch(error){
			vscode.window.showErrorMessage(error as string);
		}
	}));

	//build commands
	context.subscriptions.push(vscode.commands.registerCommand("ClioSQL.build-framework-sdk", async (item: Workspace)=>{
		try{
			const result = await item.buildFrameworkSdk();
			console.info(result);
		}
		catch(error){
			vscode.window.showErrorMessage(error as string);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand("ClioSQL.build-framework", async (item: Workspace)=>{
		try{
			const result = await item.buildFramework();
			console.info(result);
		}
		catch(error){
			vscode.window.showErrorMessage(error as string);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand("ClioSQL.build-netcore", async (item: Workspace)=>{
		try{
			const result = await item.buildNetcore();
			console.info(result);
		}
		catch(error){
			vscode.window.showErrorMessage(error as string);
		}
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand("ClioSQL.build-netcore-sdk", async (item: Workspace)=>{
		try{
			const result = await item.buildNetcoreSdk();
			console.info(result);
		}
		catch(error){
			vscode.window.showErrorMessage(error as string);
		}
	}));
	
	//#endregion

}
export function deactivate() {}


//this method is not used since we are now force updating clio and registering context menu
function checkClioLatestVersion(nugetClient: NugetClient, executor: ClioExecutor){
	(async()=>{
		await nugetClient.getServiceIndex();
		const latestNuGetClioVersion = await nugetClient.searchClioHighestVersion();
		const _lv = new mySemVer(latestNuGetClioVersion);
		
		//Clio after version 3.0.1.37 got a new command clio ver --clio
		const commandResponse = await executor.ExecuteClioCommand(`clio ver --clio`);

		//Clio pre 3.0.1.37 did not have -ver command
		const oldClioCommandResponse = await executor.ExecuteClioCommand(`clio version`);
		//old clio will return > Command failed: clio version\nclio 3.0.1.37
		const oldVersion = (oldClioCommandResponse.split('\n')[1]).split(' ')[1];

		let _installedOldVersion = new mySemVer("0.0.0.0");
		if(oldVersion){
			_installedOldVersion = new mySemVer(oldVersion);
		}
		
		const _commandParts = commandResponse.split(' ');
		let _installedVersion = new mySemVer("0.0.0.0");
		if(_commandParts && _commandParts[3]){
			_installedVersion = new mySemVer(_commandParts[3]);
		}
		
		//take highest between newClio and old clio
		const r = _installedOldVersion.compare(_installedVersion);
		const _currentVersion = (r===1) ? _installedOldVersion : _installedVersion;


		const _compResult = _lv.compare(_currentVersion);
		//const _compResult = _lv.compare(_installedVersion);
		switch(_compResult){
			case 0:
				console.log("Clio is of the latest version");
				break;
			case 1:
				(async()=>{
					await forceUpdateClio(executor);
				})();
				// vscode.window.showInformationMessage(
				// 	`Would you like to update clio to the latest version ${_lv} ?
				// 	Your version is: ${_currentVersion.toString()}`,
				// 	"UPDATE", "SKIP"
				// ).then(answer => {
				// 	if (answer === "UPDATE") {
				// 		vscode.commands.executeCommand("ClioSQL.UpdateClioCli");
				// 	}
				// });
				break;
			case -1:
				vscode.window.showInformationMessage(
					`This is impossible, installed version of clio ${_currentVersion.toString()} is greater than the latest available version. 
					Would you like to update to the latest available version ?`,
					"UPDATE", "SKIP"
				).then(answer => {
					if (answer === "UPDATE") {
						vscode.commands.executeCommand("ClioSQL.UpdateClioCli");
					}
				});
				break;
		}
	})();
}

/**
 * Forces to update clio to the latest version and registers context menu
 * Triggered onAppStart event see L42
 * @param executor command line executor
 */
async function forceUpdateClio(executor: ClioExecutor){

	const configuration = vscode.workspace.getConfiguration();
	var _isAutoUpdate = configuration.get<boolean>("clio.autoUpdateCli") ?? false;

	if(_isAutoUpdate){
		console.log("Updating clio");
		await vscode.commands.executeCommand("ClioSQL.UpdateClioCli");
	
		console.log("Registering context menu");
		await executor.ExecuteClioCommand("clio register");
	}
}

export class UIPrompt{
	private _iisValidator = new instalationInpitValidator();

	private readonly _hostname : string = 'localhost';
	private readonly _archivePath : string;
	private readonly _installRoot : string;
	private readonly _templatePrefix: string;

	constructor() {
		const configuration = vscode.workspace.getConfiguration();
		this._archivePath = configuration.get<string>("archivePath") ?? '';
		this._installRoot = configuration.get<string>("installRoot") ?? '';
		this._templatePrefix = configuration.get<string>("templatePrefix") ?? '';
	}

	//private _getAppNameAttempt = 0;
	public async getAppName(): Promise<string>{
		return await vscode.window.showInputBox({
			title: "How would you like to call your Creatio",
			prompt: "This will be IIS application Name",
			ignoreFocusOut: true,
			validateInput: text=>{
				if(this._iisValidator.takenNames.find(n=> n.toLowerCase() === text.trim().toLowerCase())){
					return "ERROR -This name is already taken, think of something new";
				}
			}
		}) ?? '';
	}

	public async getIISPortNumber(): Promise<number>{
		const _pornNumber = await vscode.window.showInputBox({
			title: "IIS Port",
			prompt: "This is IIS port where Creatio will be available",
			validateInput: text=>{
				const portNumber = parseInt(text);
				if(this._iisValidator.takenPorts.find(p=> p===portNumber)){
					return "ERROR - This port is already taken, think of a new number";
				}
			}
		}) ?? '';
		return parseInt(_pornNumber);
	}

	public async getRedisDbNumber(): Promise<number>{
		const _dbNumber = await vscode.window.showInputBox({
			title: "Redis db number",
			prompt: "Enter redis db number, values between 0 and 15",
			validateInput: text=>{
				const dbNumber = parseInt(text);
				if(dbNumber < 0 || dbNumber > 15){
					return "ERROR - Redis db can be between 0 and 15";
				}
			}
		}) ?? '';
		
		const dbNumber = parseInt(_dbNumber);
		return dbNumber;
	}
	
	public async getFolder(): Promise<string>{
		const folders = await this.getAvailableTemplateFolders();
		const opt : vscode.QuickPickOptions = {
			canPickMany: false,
			title: "Select template folder",
			ignoreFocusOut: true
		};
		const folder = await vscode.window.showQuickPick(folders, opt);
		return folder ?? '' ;	
	}

	private async getAvailableTemplateFolders(): Promise<string[]>{
		const subs = await fs.readdir(this._installRoot);
		const result = new Array<string>();
		for(let i:number = 0; i< subs.length; i++){
			console.log(i);
			if(subs[i].startsWith(this._templatePrefix)){
				const subfolder = `${this._installRoot}\\${subs[i]}`;
				const isDir = await this.checkIsFolder(subfolder);
				if(isDir){
					const folderName = subs[i].substring(9);
					result.push(folderName);
				}
			}
		}
		return result;
	}

	private async checkIsFolder(path: string): Promise<boolean>{
		try{
			const myStat = await fs.stat(path);
			const isFolder =  myStat.isDirectory();
			return isFolder;
		}
		catch(error){
			console.log(error);
			return false;
		}
	}
}
