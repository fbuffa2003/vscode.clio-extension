import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import getAppDataPath from 'appdata-path';
import { exec } from 'child_process';

export class EnvironmentService implements vscode.TreeDataProvider<CreatioInstance>{
	
	private _onDidChangeTreeData: vscode.EventEmitter<CreatioInstance | undefined | void> = new vscode.EventEmitter<CreatioInstance | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<CreatioInstance | undefined | void> = this._onDidChangeTreeData.event;
	
	private instances : Array<CreatioInstance> = [];

	/**
	 * Gets initial values from appsettings.json
	 * @returns 
	 */
	private getInitialInstances(): void {
		this.instances = [];
		const settingsFile = this.getClioEnvironments();
		const json = JSON.parse(settingsFile);
		const environments = json['Environments'];
		let keys : string[] = [];
		Object.keys(environments).forEach(key =>{
			keys.push(key);
		});
		keys.forEach(key=>{
			type ObjectKey = keyof typeof environments;
			const keyName = key as ObjectKey;
			const environment = environments[keyName];
			let instance: CreatioInstance = new CreatioInstance(key, environment['Uri'], vscode.TreeItemCollapsibleState.Collapsed);
			this.instances.push(instance);
		});

		this.instances.forEach(async element => {
			await this.updateNode(element);
		});

	}
	public refresh(): void {
		this._onDidChangeTreeData?.fire();
	}

	/**
	 * Adds new node to the existing tree
	 * @param node Node to add
	 */
	public async addNewNode(node : CreatioInstance){
		await node.checkHealth(this);
		this.instances.push(node);
		this.refresh();
	}

	public async updateNode(node: CreatioInstance) {
		await node.checkHealth(this);
	}

	getTreeItem(element: vscode.TreeItem | Thenable<vscode.TreeItem>) {
		return element;
	}
	
	getChildren(element?: CreatioInstance | undefined): vscode.ProviderResult<CreatioInstance[]> {
		if(!element){
			if(this.instances && this.instances.length === 0){
				this.getInitialInstances();
			}
			return Promise.resolve(this.instances);
		}
	}

	/**
	 * Gets content of appsettings.json
	 * @returns content of appsettings.json
	 */
	private getClioEnvironments() : string {
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
	
	contextValue = 'CreatioInstance';
	private healthStatus : HealthStatus = HealthStatus.Unknown;
	constructor(
		public readonly label: string,
		public readonly description: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState	
	) {
		super(label, collapsibleState);
		this.tooltip = label;
		this.description = description;
		this.setUnknownHealthIcon();
	}
	
	/**
	 * Checks node health
	 * @param envService 
	 */
	public async checkHealth(envService?: EnvironmentService): Promise<void>{
		const cmd = `clio hc ${this.label} -a true -h true`;
			exec(cmd, (error, stdout, stderr )=>{
				if(error){
					this.setHealthStatus(HealthStatus.UnHealthy);
					envService?.refresh();
				}
				if(stdout){
					let isWebHostOk =  stdout.match(/\tWebHost - OK/);
					let isWebAppLoaderOk = stdout.match(/\tWebAppLoader - OK/);
					if(isWebAppLoaderOk && isWebHostOk){
						this.setHealthStatus(HealthStatus.Healthy);
						envService?.refresh();
					}else{
						this.setHealthStatus(HealthStatus.UnHealthy);
						envService?.refresh();
					}
				}
				if(stderr){
					this.setHealthStatus(HealthStatus.UnHealthy);
					envService?.refresh();
				}
			});
	}


	private setHealthStatus(status: HealthStatus): void {
		switch (status){
			case  HealthStatus.Unknown : {
				this.setUnknownHealthIcon();
				break;
			}
			case  HealthStatus.Healthy : {
				this.setHealthyIcon();
				break;
			}
			case  HealthStatus.UnHealthy : {
				this.setUnhealthyIcon();
				break;
			}
		}
		
		this.healthStatus = status;
	}
	private setUnknownHealthIcon(): void {
		this.iconPath = {
			light: path.join(__filename, '..', '..','..', 'resources', 'icon', 'creatio-circle-white.svg'),
			dark: path.join(__filename, '..', '..', '..', 'resources', 'icon', 'creatio-circle-white.svg')
		};
	}
	private setHealthyIcon(): void {
		this.iconPath= {
			light: path.join(__filename, '..', '..','..', 'resources', 'icon', 'creatio-triangle.svg'),
			dark: path.join(__filename, '..', '..', '..', 'resources', 'icon', 'creatio-triangle.svg')
		};
	}
	private setUnhealthyIcon(): void {
		this.iconPath= {
			light: path.join(__filename, '..', '..','..', 'resources', 'icon', 'creatio-square.svg'),
			dark: path.join(__filename, '..', '..', '..', 'resources', 'icon', 'creatio-square.svg')
		};
	}
}

export enum HealthStatus{
	Unknown =0,
	Healthy = 1,
	UnHealthy = 2
}