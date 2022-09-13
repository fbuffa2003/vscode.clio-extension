import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import getAppDataPath from 'appdata-path';

export class EnvironmentService implements vscode.TreeDataProvider<CreatioInstance>{
	
	private _onDidChangeTreeData: vscode.EventEmitter<CreatioInstance | undefined | void> = new vscode.EventEmitter<CreatioInstance | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<CreatioInstance | undefined | void> = this._onDidChangeTreeData.event;
	
	public refresh(): void {
		this._onDidChangeTreeData?.fire();
	}

	getTreeItem(element: CreatioInstance): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return element;
	}
	
	getChildren(element?: CreatioInstance | undefined): vscode.ProviderResult<CreatioInstance[]> {
		const settingsFile = this.getClioEnvironments();
		const json = JSON.parse(settingsFile);
		const environments = json['Environments'];
		if(element === undefined){
			let instances : Array<CreatioInstance> = [];
			let keys : string[] = [];
			Object.keys(environments).forEach(key =>{
				keys.push(key);
			});
			keys.forEach(key=>{
				type ObjectKey = keyof typeof environments;
				const keyName = key as ObjectKey;
				const environment = environments[keyName];
				let instance:CreatioInstance = new CreatioInstance(key, environment['Uri'], vscode.TreeItemCollapsibleState.Collapsed);
				instances.push(instance);
			});
			return Promise.resolve(instances);
		}
		return Promise.resolve([]);
	}

	getClioEnvironments() : string {
		let file = fs.readFileSync(
			path.join(getAppDataPath() + "\\..\\Local\\creatio\\clio\\appsettings.json"),
			{
				encoding: "utf-8"
			}
		);
		return file;
	}

	
}

export class CreatioInstance extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly description: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState
	) {
		super(label, collapsibleState);
		this.tooltip = label;
		this.description = description;
	}
	iconPath = {
		light: path.join(__filename, '..', '..','..', 'resources', 'icon', 'creatio-circle-white.svg'),
		dark: path.join(__filename, '..', '..', '..', 'resources', 'icon', 'creatio-circle-white.svg')
	};
	contextValue = 'CreatioInstace';
}