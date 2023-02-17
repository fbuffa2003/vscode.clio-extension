import * as vscode from 'vscode';
import * as fs from 'fs';
import path = require('path');
import getAppDataPath from 'appdata-path';
import { CreatioTreeItem } from './CreatioTreeItem';
import { Environment, IConnectionSettings } from './Environment';


export class CreatioTreeItemProvider implements vscode.TreeDataProvider<CreatioTreeItem>{

	private _onDidChangeTreeData: vscode.EventEmitter<CreatioTreeItem | undefined | void> = new vscode.EventEmitter<CreatioTreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<CreatioTreeItem | undefined | void> = this._onDidChangeTreeData.event;

	private _onDidStatusUpdate: vscode.EventEmitter<CreatioTreeItem> = new vscode.EventEmitter<CreatioTreeItem>();
	readonly onDidStatusUpdate: vscode.Event<CreatioTreeItem> = this._onDidStatusUpdate.event;

	public environments = new Array<Environment>();

	getTreeItem(element: CreatioTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return element;
	}

	getChildren(element?: CreatioTreeItem | undefined): vscode.ProviderResult<CreatioTreeItem[]> {
		if(!element){
			if(this.environments.length>0) {
				return Promise.resolve(this.environments);
			}
			this.environments = this.environments.sort((a,b) => 0 - (a.label.toLowerCase() > b.label.toLowerCase() ? -1 : 1));
			return Promise.resolve(this.environments);
		}
		if(element instanceof CreatioTreeItem){
			return Promise.resolve(element.items);
		}
	}

	public refresh(): void {
		this._onDidChangeTreeData?.fire();
	}

	public findInstanceByName(name: String): Environment | undefined {
		return this.environments.find(instance => instance.label===name);
	}

	public async addNewNode(name: string , connectionSettings : IConnectionSettings){

		const newEnvironment = new Environment(name, connectionSettings);
		newEnvironment.onDidStatusUpdate((instance: CreatioTreeItem)=>{
			this.handleUpdateNode(instance);
		});

		newEnvironment.onDeleted((instance: CreatioTreeItem)=>{
			this.handleDeleteNode(instance);
		});

		this.environments.push(newEnvironment);
		this.environments = this.environments.sort((a,b) => 0 - (a.label.toLowerCase() > b.label.toLowerCase() ? -1 : 1));
		this._onDidChangeTreeData.fire();
	}

	public async reload(){
		(async()=>{
			await this.dispose();
		})();
		this.refresh();
	}
	
	private async dispose(): Promise<void>{
		for (let index = 0; index < this.environments.length; index++) {
			const environment = this.environments[index];
			await environment.StopLogBroadcast();
			environment.StopListening();
		}
		this.environments = new Array<Environment>();
	}
}