// import * as vscode from 'vscode';
// import * as path from 'path';
// import * as fs from 'fs';
// import getAppDataPath from 'appdata-path';
// import { CreatioInstance } from './CreatioInstance';

/* !!! DEPRICATED USE CreatioTreeItemProvider INSTEAD!!! */


// export class EnvironmentService2 implements vscode.TreeDataProvider<CreatioInstance>{
	
// 	private _onDidChangeTreeData: vscode.EventEmitter<CreatioInstance | undefined | void> = new vscode.EventEmitter<CreatioInstance | undefined | void>();
// 	readonly onDidChangeTreeData: vscode.Event<CreatioInstance | undefined | void> = this._onDidChangeTreeData.event;
// 	private instances : Array<CreatioInstance> = [];

// 	private handleUpdateNode(instance: CreatioInstance):void {
// 		const underChange = this.instances.find(i=> i.id === instance.id);
// 		this._onDidChangeTreeData.fire(underChange);
// 	}

// 	private handleDeleteNode(instance: CreatioInstance):void {
// 		const removedInstance = this.instances.find(i=> i.id === instance.id);
// 		if (removedInstance) {
// 			var removedIndex = this.instances.indexOf(removedInstance);
// 			this.instances.splice(removedIndex);
// 		}
// 		this.refresh();
// 	}

// 	public findInstanceByName(name: String): CreatioInstance | undefined {
// 		return this.instances.find(instance => instance.label===name);
// 	}
// 	/**
// 	 * Gets initial values from appsettings.json
// 	 * @returns 
// 	 */
// 	private getInitialInstances(): void {
// 		this.instances = [];
// 		const settingsFile = this.getClioEnvironments();
// 		const json = JSON.parse(settingsFile);
// 		const environments = json['Environments'];
// 		let keys : string[] = [];
// 		Object.keys(environments).forEach(key =>{
// 			keys.push(key);
// 		});
// 		keys.forEach(key=>{
// 			type ObjectKey = keyof typeof environments;
// 			const keyName = key as ObjectKey;
// 			const environment = environments[keyName];
// 			const userName :string = environment['Login'];
// 			const password : string = environment['Password'];
// 			const isNetCore : boolean = environment['IsNetCore'];

// 			let instance: CreatioInstance = new CreatioInstance(
// 				key, environment['Uri'], userName, password, isNetCore,
// 				vscode.TreeItemCollapsibleState.Collapsed);

// 			instance.onDidStatusUpdate((instance: CreatioInstance)=>{
// 				this.handleUpdateNode(instance);
// 			});

// 			instance.onDeleted((instance: CreatioInstance)=>{
// 				this.handleDeleteNode(instance);
// 			});
			
// 			instance.checkHealth();
// 			this.instances.push(instance);
// 		});
// 	}
// 	public refresh(): void {
// 		this._onDidChangeTreeData?.fire();
// 	}

// 	/**
// 	 * Adds new node to the existing tree
// 	 * @param node Node to add
// 	 */
// 	public async addNewNode(node : CreatioInstance){
// 		await node.checkHealth();
// 		this.instances.push(node);
// 		node.onDidStatusUpdate((instance: CreatioInstance)=>{
// 			this.handleUpdateNode(instance);
// 		});
// 		node.onDeleted((instance: CreatioInstance)=>{
// 			this.handleDeleteNode(instance);
// 		});
// 		this.refresh();
// 	}

// 	public async updateNode(node: CreatioInstance) {
// 		const underChange = this.instances.find(i=> i.id === node.id);
// 		underChange?.checkHealth();
// 	}

// 	getTreeItem(element: vscode.TreeItem | Thenable<vscode.TreeItem>) {
// 		return element;
// 	}
	
// 	getChildren(element?: CreatioInstance | undefined): vscode.ProviderResult<CreatioInstance[]> {
// 		if(!element){
// 			if(this.instances && this.instances.length === 0){
// 				this.getInitialInstances();
// 			}
// 			return Promise.resolve(this.instances);
// 		}
// 	}

// 	/**
// 	 * Gets content of appsettings.json
// 	 * @returns content of appsettings.json
// 	 */
// 	private getClioEnvironments() : string {
// 		let file = fs.readFileSync(
// 			path.join(getAppDataPath() + "\\..\\Local\\creatio\\clio\\appsettings.json"),
// 			{
// 				encoding: "utf-8"
// 			}
// 		);
// 		return file;
// 	}
// }

// export enum HealthStatus{
// 	unknown =0,
// 	healthy = 1,
// 	unHealthy = 2
// }
