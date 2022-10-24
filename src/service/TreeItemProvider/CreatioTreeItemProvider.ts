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

			const map = this.getClioEnvironments();
			for (let [key, value] of map.entries()) {
				const instance = new Environment(key, value);

				instance.onDidStatusUpdate((instance: CreatioTreeItem)=>{
					this.handleUpdateNode(instance);
				});

				instance.onDeleted((instance: CreatioTreeItem)=>{
					this.handleDeleteNode(instance);
				});

				this.environments.push(instance);
			}
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
		this._onDidChangeTreeData.fire();
	}

	//#region Methods : Private
	private getClioEnvironments() : Map<string, IConnectionSettings> {
		let file = fs.readFileSync(
			path.join(getAppDataPath() + "\\..\\Local\\creatio\\clio\\appsettings.json"),
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

	private handleUpdateNode(instance: CreatioTreeItem):void {
		this._onDidChangeTreeData.fire(instance);
	}
	private handleDeleteNode(instance: CreatioTreeItem):void {

		const removedInstance = this.environments.find(i=> i.label === instance.label);
		if (removedInstance) {
			var removedIndex = this.environments.indexOf(removedInstance);
			this.environments.splice(removedIndex,1);
		}
		this._onDidChangeTreeData.fire();
	}
	//#endregion
}