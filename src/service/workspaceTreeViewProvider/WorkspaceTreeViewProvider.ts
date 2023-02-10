import * as vscode from 'vscode';
import * as fs from 'fs';
import path = require('path');
import { readdir } from 'fs/promises';
import { mySemVer } from '../../utilities/mySemVer';
import { cwd } from 'process';
import { ClioExecutor } from '../../Common/clioExecutor';
import nodeTest from 'node:test';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';


export class WorkspaceTreeViewProvider implements vscode.TreeDataProvider<vscode.TreeItem>{

	
	private _workspaces : Array<Workspace> = new Array<Workspace>;
	constructor(private workspaceRoot: readonly vscode.WorkspaceFolder[] | undefined ) {

		// vscode.workspace.onDidChangeWorkspaceFolders((event: vscode.WorkspaceFoldersChangeEvent)=> {
		// 	console.info("Folder added to workspace");
		// });

		const rootFolder = vscode.workspace.workspaceFolders;
		if(rootFolder && rootFolder.length>0){
			const rootPath : string = rootFolder[0].uri.fsPath ;
			const dirs = fs.readdirSync(rootPath);

			dirs.forEach(dir => {
				const subDir = path.join(rootPath, dir);
				var isWs = this.isWorkspace(subDir);
				console.info(`${subDir} is workspace: ${isWs}`);
				
				if(isWs){

					const workspace = new Workspace(dir, vscode.TreeItemCollapsibleState.Collapsed, vscode.Uri.file(subDir),"Workspace");
					this._workspaces.push(workspace);
				}
			});
		}


		// if (rootFolder) {
		// 	let watcher = vscode.workspace.createFileSystemWatcher(
		// 	new vscode.RelativePattern(rootFolder[0], "**"), false, false, false);
		// 	watcher.onDidCreate(uri => this.handleNewFolderCreated(uri));
		// 	watcher.onDidChange(uri => this.handleNewFolderCreated(uri));
		// 	watcher.onDidDelete(uri => this.handleNewFolderCreated(uri));
		// }
	}


	private handleNewFolderCreated(uri: vscode.Uri){
		console.log(`created ${uri}`);
		var x = path.parse(uri.fsPath);

		if(this.workspaceRoot && this.workspaceRoot.length>0 && this.workspaceRoot[0].uri.fsPath === x.dir){
			console.info(`Created in Root`);
			console.info(`Parent: ${x.dir}`);
		}
	}


	public updateWorkspaceRoot(workspaceRoot: readonly vscode.WorkspaceFolder[]): void{
		this.workspaceRoot = workspaceRoot;
	}

	getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return element;
	}

	getChildren(element?: vscode.TreeItem | undefined): vscode.ProviderResult<vscode.TreeItem[]> {
		
		if(this.workspaceRoot === undefined){
			return Promise.resolve([]);
		}
		else if(element instanceof Workspace){
			return Promise.resolve([...element.applications, ...element.packages]);
		}

		else if(element instanceof Application){
			const result = new Array<vscode.TreeItem>();

			return Promise.resolve(result);
		}

		else if(element instanceof Package){
			return Promise.resolve([]);
		}
		else{
			//return this.getWorkspaces();
			return this._workspaces;
		}

	}

	
	private isWorkspace(folderPath : string): boolean{	
		const ws = path.join(folderPath, ".clio","workspaceSettings.json");
		return fs.existsSync(ws);
	}

	

	//#endregion
}

export class Workspace extends vscode.TreeItem {
	
	
	private _remote : vscode.Uri | undefined;
	public get remote() : vscode.Uri | undefined{
		return this._remote;
	}
	public set value(v : vscode.Uri | undefined) {
		this._remote = v;
	}
	
	
	private _packages : Array<Package> = new Array<Package>;
	public get packages() : Array<Package> {
		return this._packages;
	}
	private set packages(v : Array<Package>) {
		this._packages = v;
	}

	private _applications : Array<Application> = new Array<Application>;
	public get applications() : Array<Application> {
		return this._applications;
	}
	private set applications(v : Array<Application>) {
		this._applications = v;
	}
	
	private _clioExecutor : ClioExecutor;
	private get clioExecutor() : ClioExecutor {
		return this._clioExecutor;
	}
	private set clioExecutor(v : ClioExecutor) {
		this._clioExecutor = v;
	}
	

	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly folder : vscode.Uri,
		public readonly description? : string,
		
	) {
		super(label, collapsibleState);
		this.tooltip = new vscode.MarkdownString("See workspace [documentation](https://github.com/Advance-Technologies-Foundation/clio#workspaces)");
		this.description = description ?? '';
		this.contextValue = "clio.Workspace";
		this._clioExecutor = new ClioExecutor();

		this.getRemote();
		(async()=>{
			await this.getPackagesfromJson();
		})();
	}
	iconPath = new vscode.ThemeIcon("symbol-namespace");

	private getPackagesfromJson() : void {

		try {
			const workspaceSettingFilePath = path.join(this.folder.fsPath, ".clio","workspaceSettings.json");
			const jsonFileContent = fs.readFileSync(workspaceSettingFilePath);
			var json = jsonFileContent.toString('utf8');
			//https://github.com/nodejs/node-v0.x-archive/issues/4039#issuecomment-8828783
			if (json.charAt(0) === '\uFEFF'){
				json = json.substr(1);
			} 
			const model = JSON.parse(json);

			const settings = {
				ApplicationVersion: new mySemVer(model['ApplicationVersion']),
				Packages : model["Packages"]
			} as IWorkspaceSettings;

			settings.Packages.forEach(packageName => {
				const p = new Package(packageName, this.folder);
				this.packages.push(p);
			});

			
		} catch (error) {
			console.error(error);
		}		
	}


	/**
	 * Checks if Workspace contains .git forlder. If so then gets remote url
	 * @returns void
	 */
	private getRemote():void{

		//When .git folder does not exist it cannot be a git repository
		var dir = fs.readdirSync(this.folder.fsPath);
		if(dir.find(d=> d===".git")=== undefined){
			return;
		}

		try{
			const buffer = execSync("git remote -v",{cwd: this.folder.fsPath});
			const remote = buffer.toString('utf8');

			const lines: Array<string> = remote.split('\n');
			const url = lines[0].split('\t')[1].split(' ')[0];
			this._remote = vscode.Uri.parse(url);
			
			this.contextValue = "clio.Workspace.gitInitialized";
			console.info(remote);
		}
		catch(error){
			console.info(`${this.label} is not a git repository`);
		}
	}

	//TODO: Shold this even be here, or should I return path and call open from extension ?
	public async openSolutionFramework():Promise<string>{
		
		if(process.platform !== 'win32'){
			return Promise.reject("Unsupported platform");
		}

		return await this.clioExecutor.ExecuteTaskCommand(
			vscode.Uri.file(path.join(this.folder.fsPath, "tasks")), 
			"open-solution-framework.cmd"
		);
	}
	public async openSolutionFrameworkSdk():Promise<string>{
		if(process.platform !== 'win32'){
			return Promise.reject("Unsupported platform");
		}

		return await this.clioExecutor.ExecuteTaskCommand(
			vscode.Uri.file(path.join(this.folder.fsPath, "tasks")), 
			"open-solution-framework-sdk.cmd"
		);
	}
	public async openSolutionNetcore():Promise<string>{
		if(process.platform !== 'win32'){
			return Promise.reject("Unsupported platform");
		}
		return await this.clioExecutor.ExecuteTaskCommand(
			vscode.Uri.file(path.join(this.folder.fsPath, "tasks")), 
			"open-solution-netcore.cmd"
		);
	}
	public async openSolutionNetcoreSdk():Promise<string>{
		if(process.platform !== 'win32'){
			return Promise.reject("Unsupported platform");
		}
		return await this.clioExecutor.ExecuteTaskCommand(
			vscode.Uri.file(path.join(this.folder.fsPath, "tasks")), 
			"open-solution-netcore-sdk.cmd"
		);
	}
	public async buildFramework():Promise<string>{
		if(process.platform !== 'win32'){
			return Promise.reject("Unsupported platform");
		}
		return await this.clioExecutor.ExecuteTaskCommand(
			vscode.Uri.file(path.join(this.folder.fsPath, "tasks")), 
			"build-framework.cmd"
		);
	}
	public async buildFrameworkSdk():Promise<string>{
		if(process.platform !== 'win32'){
			return Promise.reject("Unsupported platform");
		}
		return await this.clioExecutor.ExecuteTaskCommand(
			vscode.Uri.file(path.join(this.folder.fsPath, "tasks")), 
			"build-framework-sdk.cmd"
		);
	}
	public async buildNetcore():Promise<string>{
		let cmd = "build-netcore.cmd";
		if(process.platform !== 'win32'){
			cmd = "build-netcore.sh";
		}
		return await this.clioExecutor.ExecuteTaskCommand(
			vscode.Uri.file(path.join(this.folder.fsPath, "tasks")), 
			cmd
		);
	}
	public async buildNetcoreSdk():Promise<string>{
		let cmd = "build-netcore-sdk.cmd";
		if(process.platform !== 'win32'){
			cmd = "build-netcore-sdk.sh";
		}
		
		return await this.clioExecutor.ExecuteTaskCommand(
			vscode.Uri.file(path.join(this.folder.fsPath, "tasks")), 
			cmd
		);
	}
	public async runAllPlatfromBuild():Promise<string>{
		
		if(process.platform !== 'win32'){
			return Promise.reject("Unsupported platform");
		}
		return await this.clioExecutor.ExecuteTaskCommand(
			vscode.Uri.file(path.join(this.folder.fsPath, "tasks")), 
			"run-all-platfrom-build.cmd"
		);
	}
	public async runAllPlatfromBuildSdk():Promise<string>{
		
		if(process.platform !== 'win32'){
			return Promise.reject("Unsupported platform");
		}
		return await this.clioExecutor.ExecuteTaskCommand(
			vscode.Uri.file(path.join(this.folder.fsPath, "tasks")), 
			"run-all-platfrom-build-sdk.cmd"
		);
	}

	/**
	 * Restores workspace from cloud instance, see clio restorew for details
	 * https://github.com/Advance-Technologies-Foundation/clio#workspaces
	 * @param env Optional environment name, if nothing is passed will use default env set in clio
	 */
	public async restorew(env?: string): Promise<void>{
		if(env){
			await this.clioExecutor.ExecuteTaskCommand(this.folder, `clio restorew -e ${env}`);
		}else{
			await this.clioExecutor.ExecuteTaskCommand(this.folder, `clio restorew`);
		}
	}
	
	/**
	 * Pushes workspace to cloud instance, see clio pushw for details
	 * https://github.com/Advance-Technologies-Foundation/clio#workspaces
	 * @param env Optional environment name, if nothing is passed will use default env set in clio
	 */
	public async pushw(env?: string): Promise<void>{

		if(env){
			await this.clioExecutor.ExecuteTaskCommand(this.folder, `clio pushw -e ${env}`);
		}else{
			await this.clioExecutor.ExecuteTaskCommand(this.folder, `clio pushw`);
		}
	}
	
	/**
	 * Downloads Configuration (clio dconf)
	 * https://github.com/Advance-Technologies-Foundation/clio#workspaces
	 * @param env Optional environment name, if nothing is passed will use default env set in clio
	 */
	public async dconf(env?: string): Promise<void>{
		if(env){
			await this.clioExecutor.ExecuteTaskCommand(this.folder, `clio dconf -e ${env}`);
		}else{
			await this.clioExecutor.ExecuteTaskCommand(this.folder, `clio dconf`);
		}
	}
}


export class Package extends vscode.TreeItem{
	
		
	constructor(
		public readonly label: string,
		private readonly folderUri: vscode.Uri
	  ) {
		super(label, vscode.TreeItemCollapsibleState.None);
		this.tooltip = new vscode.MarkdownString("This is an assembly package, read more on the [academy](https://academy.creatio.com/docs/developer/development_tools/packages/assembly_package/overview)");
		
		this.getDescription();
		this.contextValue = "clio.Package";
	  }
	iconPath = new vscode.ThemeIcon("package");

	private getDescription(): void{
		const descriptorFilePath = path.join(this.folderUri.fsPath, "packages",this.label,"descriptor.json");
		if(!fs.existsSync(descriptorFilePath)){return;}

		try {
			const jsonFileContent = fs.readFileSync(descriptorFilePath);
			var json = jsonFileContent.toString('utf8');
			//https://github.com/nodejs/node-v0.x-archive/issues/4039#issuecomment-8828783
			if (json.charAt(0) === '\uFEFF'){
				json = json.substr(1);
			} 

			const model = JSON.parse(json);
			const description = model['Descriptor']['Description'];
			this.description = description ?? "Missing description";

		} catch (error) {
			console.error(error);
		}
	}
}

export class Application extends vscode.TreeItem{
	constructor(
		public readonly label: string,
		private version: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		
	  ) {
		super(label, collapsibleState);
		this.tooltip = `Application`;
		this.description = this.version;
		this.contextValue = "clio.Application";
	  }
	
	iconPath = new vscode.ThemeIcon("symbol-class");
}

export interface IWorkspaceSettings {
	ApplicationVersion: mySemVer
	Packages: Array<string>
}