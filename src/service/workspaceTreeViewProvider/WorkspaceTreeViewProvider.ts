import * as vscode from 'vscode';
import * as fs from 'fs';
import path = require('path');
import { mySemVer } from '../../utilities/mySemVer';
import { ClioExecutor } from '../../common/clioExecutor';
import { execSync } from 'child_process';
import { Environment } from '../TreeItemProvider/Environment';
import { env } from 'process';
import { CreatioTreeItemProvider } from '../TreeItemProvider/CreatioTreeItemProvider';

//import { readdir } from 'fs/promises';
//import { cwd } from 'process';
//import nodeTest from 'node:test';
//import { fileURLToPath } from 'url';


/**
 * Creatio workspaces
 */
export class WorkspaceTreeViewProvider implements vscode.TreeDataProvider<vscode.TreeItem>{
	private _knownEnvironments : Array<Environment> = new Array<Environment>();
	private _workspaces : Array<Workspace> = new Array<Workspace>;
	
	private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;
	/**
	 * @param workspaceRoot array of workspace folders opened in vscode
	 * - See _vscode_ {@link https://code.visualstudio.com/api/extension-guides/tree-view **Tree View API**} documentation
	 */
	constructor(
		private workspaceRoot: readonly vscode.WorkspaceFolder[] | undefined, 
		private environments: Array<Environment> )
	{
		this.InitWorkspaces();
		
	}

	private InitWorkspaces(): void {

		this._workspaces = new Array<Workspace>();
		const rootFolder = vscode.workspace.workspaceFolders;
		if(rootFolder && rootFolder.length>0){
			const rootPath : string = rootFolder[0].uri.fsPath ;
			
			if(this.isWorkspace(rootPath)){
				const a = this.getConfiguredEnvironment(vscode.Uri.file(rootPath));
				const env = this.environments.find(e=> e.label === a?.Environment);
				const workspace = new Workspace(rootPath, vscode.TreeItemCollapsibleState.Collapsed, vscode.Uri.file(rootPath), env, "");
				this._workspaces.push(workspace);
				return;
			}

			const dirs = fs.readdirSync(rootPath);
			dirs.forEach(dir => {
				const subDir = path.join(rootPath, dir);
				var isWs = this.isWorkspace(subDir);
				console.info(`${subDir} is workspace: ${isWs}`);
				
				if(isWs){
					const a = this.getConfiguredEnvironment(vscode.Uri.file(subDir));
					const env = this.environments.find(e=> e.label === a?.Environment);

					const workspace = new Workspace(dir, vscode.TreeItemCollapsibleState.Collapsed, vscode.Uri.file(subDir),env, "");
					this._workspaces.push(workspace);
				}
			});
		}
	}


	public refresh(): void {
		this.InitWorkspaces();
		this._onDidChangeTreeData?.fire();
	}
	private getConfiguredEnvironment(folder: vscode.Uri) : IWorkspaceEnvironmentSettings | undefined {
		try{
			const workspaceEnvironmentSettingFilePath = path.join(folder.fsPath, ".clio","workspaceEnvironmentSettings.json");
			const jsonFileContent = fs.readFileSync(workspaceEnvironmentSettingFilePath);
			var json = jsonFileContent.toString('utf8');
			//https://github.com/nodejs/node-v0.x-archive/issues/4039#issuecomment-8828783
			if (json.charAt(0) === '\uFEFF'){
				json = json.substring(1);
			} 
			const model = JSON.parse(json) as IWorkspaceEnvironmentSettings;
			return model;
		}
		catch(error:any){
			console.error("Could not determine default environment from workspaceEnvironmentSettings.json, using default from clio ");
		}
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

	public updateKnownEnvironments(environments: Array<Environment>){
		if(environments.length>0){
			this._knownEnvironments = environments;
		}
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
			return this._workspaces;
		}

	}

	/**
	 * Checks if folder is a workspace, by checking if `./clio/workspaceSettings.json` file is present 
	 * @param folderPath Folder path
	 * @returns 
	 * - TRUE when folder is a workspace
	 * - FALSE when folder is NOT a workspace
	 */ 
	private isWorkspace(folderPath : string): boolean{	
		//const ws = path.join(folderPath, ".clio","workspaceSettings.json");
		const ws = path.join(folderPath, ".clio");
		return fs.existsSync(ws);
	}

	//#endregion
}

export class Workspace extends vscode.TreeItem {
	
	iconPath= new vscode.ThemeIcon("symbol-namespace");
	public _currentEnvironment : Environment | undefined;
	
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
		environment?: Environment,
		public readonly description? : string
	) {
		super(label, collapsibleState);
		
		this._currentEnvironment = environment;

		this.tooltip = new vscode.MarkdownString("See workspace [documentation](https://github.com/Advance-Technologies-Foundation/clio#workspaces)");
		this.description = description ?? '';
		this.contextValue = "clio.Workspace";
		this._clioExecutor = new ClioExecutor();

		this.getRemote();
		(async()=>{
			await this.getPackagesFromJson();
		})();
	}

	

	private getPackagesFromJson() : void {

		try {
			const workspaceSettingFilePath = path.join(this.folder.fsPath, ".clio","workspaceSettings.json");
			const jsonFileContent = fs.readFileSync(workspaceSettingFilePath);
			var json = jsonFileContent.toString('utf8');
			//https://github.com/nodejs/node-v0.x-archive/issues/4039#issuecomment-8828783
			if (json.charAt(0) === '\uFEFF'){
				json = json.substring(1);
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
	 * Checks if Workspace contains `.git` folder. and sets contextValue
	 * 
	 * @returns void
	 */
	private getRemote(): void {

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
			//console.info(remote);
		}
		catch(error){
			console.info(`${this.label} is not a git repository`);
		}
	}

	//TODO: Shold this even be here, or should I return path and call open from extension ?
	
	/** Checks if in Windows, and executes `/tasks/open-solution-framework.cmd` from workspace folder
	 * @returns response form terminal
	 */
	public async openSolutionFrameworkAsync():Promise<string>{
		
		if(process.platform !== 'win32'){
			return Promise.reject("Unsupported platform");
		}

		return await this.clioExecutor.ExecuteTaskCommand(
			vscode.Uri.file(path.join(this.folder.fsPath, "tasks")), 
			"open-solution-framework.cmd"
		);
	}

	/** Checks if in Windows, and executes `/tasks/open-solution-framework-sdk.cmd` from workspace folder
	 * @returns response form terminal
	 */
	public async openSolutionFrameworkSdkAsync():Promise<string>{
		if(process.platform !== 'win32'){
			return Promise.reject("Unsupported platform");
		}

		return await this.clioExecutor.ExecuteTaskCommand(
			vscode.Uri.file(path.join(this.folder.fsPath, "tasks")), 
			"open-solution-framework-sdk.cmd"
		);
	}

	/** Checks if in Windows, and executes `/tasks/open-solution-netcore.cmd` from workspace folder
	 * @returns response form terminal
	 */
	public async openSolutionNetcoreAsync():Promise<string>{
		if(process.platform !== 'win32'){
			return Promise.reject("Unsupported platform");
		}
		return await this.clioExecutor.ExecuteTaskCommand(
			vscode.Uri.file(path.join(this.folder.fsPath, "tasks")), 
			"open-solution-netcore.cmd"
		);
	}

	/** Checks if in Windows, and executes `/tasks/open-solution-netcore-sdk.cmd` from workspace folder
	 * @returns response form terminal
	 */
	public async openSolutionNetcoreSdkAsync():Promise<string>{
		if(process.platform !== 'win32'){
			return Promise.reject("Unsupported platform");
		}
		return await this.clioExecutor.ExecuteTaskCommand(
			vscode.Uri.file(path.join(this.folder.fsPath, "tasks")), 
			"open-solution-netcore-sdk.cmd"
		);
	}

	/** Checks if in Windows, and executes `/tasks/build-framework.cmd` from workspace folder
	 * @returns response form terminal
	 */
	public async buildFrameworkAsync():Promise<string>{
		if(process.platform !== 'win32'){
			return Promise.reject("Unsupported platform");
		}
		return await this.clioExecutor.ExecuteTaskCommand(
			vscode.Uri.file(path.join(this.folder.fsPath, "tasks")), 
			"build-framework.cmd"
		);
	}

	/** Checks if in Windows, and executes `/tasks/build-framework-sdk.cmd` from workspace folder
	 * @returns response form terminal
	 */
	public async buildFrameworkSdkAsync():Promise<string>{
		if(process.platform !== 'win32'){
			return Promise.reject("Unsupported platform");
		}
		return await this.clioExecutor.ExecuteTaskCommand(
			vscode.Uri.file(path.join(this.folder.fsPath, "tasks")), 
			"build-framework-sdk.cmd"
		);
	}

	/** Checks if in Windows, and executes `/tasks/build-netcore.cmd` from workspace folder
	 * @returns response form terminal
	 */
	public async buildNetcoreAsync():Promise<string>{
		let cmd = "build-netcore.cmd";
		if(process.platform !== 'win32'){
			cmd = "build-netcore.sh";
		}
		return await this.clioExecutor.ExecuteTaskCommand(
			vscode.Uri.file(path.join(this.folder.fsPath, "tasks")), 
			cmd
		);
	}

	/** Checks if in not Windows, and executes `/tasks/build-netcore-sdk.sh` from workspace folder
	 * @returns response form terminal
	 */
	public async buildNetcoreSdkAsync():Promise<string>{
		let cmd = "build-netcore-sdk.cmd";
		if(process.platform !== 'win32'){
			cmd = "build-netcore-sdk.sh";
		}
		
		return await this.clioExecutor.ExecuteTaskCommand(
			vscode.Uri.file(path.join(this.folder.fsPath, "tasks")), 
			cmd
		);
	}

	/** Checks if in Windows, and executes `/tasks/run-all-platfrom-build.cmd` from workspace folder
	 * @returns response form terminal
	 */
	public async runAllPlatformBuildAsync():Promise<string>{
		
		if(process.platform !== 'win32'){
			return Promise.reject("Unsupported platform");
		}
		return await this.clioExecutor.ExecuteTaskCommand(
			vscode.Uri.file(path.join(this.folder.fsPath, "tasks")), 
			"run-all-platfrom-build.cmd"
		);
	}

	/** Checks if in Windows, and executes `/tasks/run-all-platfrom-build-sdk.cmd` from workspace folder
	 * @returns response form terminal
	 */
	public async runAllPlatformBuildSdkAsync():Promise<string>{
		
		if(process.platform !== 'win32'){
			return Promise.reject("Unsupported platform");
		}
		return await this.clioExecutor.ExecuteTaskCommand(
			vscode.Uri.file(path.join(this.folder.fsPath, "tasks")), 
			"run-all-platfrom-build-sdk.cmd"
		);
	}

	/** Restores workspace from an environment
	 *
	 * See clio {@link https://github.com/Advance-Technologies-Foundation/clio/blob/master/clio/Command/RestoreWorkspaceCommand.cs **restorew**} documentation
	 * @param env Optional environment name, uses default environment when empty
	 */
	public async restorewAsync(env?: string): Promise<void>{
		if(env){
			await this.clioExecutor.ExecuteTaskCommand(this.folder, `clio restorew -e ${env}`);
		}else if(this._currentEnvironment){
			await this.clioExecutor.ExecuteTaskCommand(this.folder, `clio restorew -e ${this._currentEnvironment.label}`);
		}else{
			await this.clioExecutor.ExecuteTaskCommand(this.folder, `clio restorew`);
		}
	}
	
	/** Pushes workspace to an environment
	 *
	 * See clio {@link https://github.com/Advance-Technologies-Foundation/clio/blob/master/clio/Command/PushWorkspaceCommand.cs **pushw**} documentation
	 * @param env Optional environment name, uses default environment when empty
	 */
	public async pushwAsync(env?: string): Promise<void>{
		if(env){
			await this.clioExecutor.ExecuteTaskCommand(this.folder, `clio pushw -e ${env}`);
		}else if(this._currentEnvironment){
			await this.clioExecutor.ExecuteTaskCommand(this.folder, `clio pushw -e ${this._currentEnvironment.label}`);
		}else{
			await this.clioExecutor.ExecuteTaskCommand(this.folder, `clio restorew`);
		}
	}
	
	/** Downloads Configuration
	 * 
	 * See clio {@link https://github.com/Advance-Technologies-Foundation/clio/blob/master/clio/Command/DownloadConfigurationCommand.cs **dconf**} documentation
	 * @param env Optional environment name, uses default environment whe empty
	 */
	public async dconfAsync(env?: string): Promise<void>{
		if(env){
			await this.clioExecutor.ExecuteTaskCommand(this.folder, `clio dconf -e ${env}`);
		}else if(this._currentEnvironment){
			await this.clioExecutor.ExecuteTaskCommand(this.folder, `clio dconf -e ${this._currentEnvironment.label}`);
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
			this.description = description ?? "";

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

export interface IWorkspaceEnvironmentSettings {
	Environment: string | undefined
}