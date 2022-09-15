import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import getAppDataPath from 'appdata-path';
import { exec } from 'child_process';
import { randomUUID } from 'crypto';
import { ClioExecutor } from '../Common/clioExecutor';
import { rmSync, writeFileSync } from 'fs';
import { rm, writeFile } from 'fs/promises';
import { Clio } from '../commands/Clio';
import { ISqlArgs } from '../commands/SqlCommand';
import { IHealthCheckArgs } from '../commands/HealthCheckCommand';
import { IFlushDbArgs } from '../commands/FlushDbCommand';

export class EnvironmentService implements vscode.TreeDataProvider<CreatioInstance>{
	
	private _onDidChangeTreeData: vscode.EventEmitter<CreatioInstance | undefined | void> = new vscode.EventEmitter<CreatioInstance | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<CreatioInstance | undefined | void> = this._onDidChangeTreeData.event;
	private instances : Array<CreatioInstance> = [];

	private handleUpdateNode(instance: CreatioInstance):void {
		const underChange = this.instances.find(i=> i.id === instance.id);
		this._onDidChangeTreeData.fire(underChange);
	}

	public findInstanceByName(name: String): CreatioInstance | undefined {
		return this.instances.find(instance => instance.label===name);
	}
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

			instance.onDidStatusUpdate((instance: CreatioInstance)=>{
				this.handleUpdateNode(instance);
			});
			
			instance.checkHealth();
			this.instances.push(instance);
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
		await node.checkHealth();

		node.onDidStatusUpdate((instance: CreatioInstance)=>{
			this.handleUpdateNode(instance);
		});
		this.instances.push(node);
	}

	public async updateNode(node: CreatioInstance) {
		const underChange = this.instances.find(i=> i.id === node.id);
		underChange?.checkHealth();
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
	
	private _onDidStatusUpdate: vscode.EventEmitter<CreatioInstance> = new vscode.EventEmitter<CreatioInstance>();
	readonly onDidStatusUpdate: vscode.Event<CreatioInstance> = this._onDidStatusUpdate.event;
	private readonly clioExecutor : ClioExecutor;
	private readonly clio : Clio;

	contextValue = 'CreatioInstance';
	private healthStatus : HealthStatus = HealthStatus.unknown;
	constructor(
		public readonly label: string,
		public readonly description: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState	
	) {
		super(label, collapsibleState);
		this.tooltip = label;
		this.description = description;
		this.setUnknownHealthIcon();
		this.id = randomUUID();
		this.clioExecutor = new ClioExecutor();
		this.clio = new Clio();
	}
	
	/**
	 * Checks node health
	 * @param envService 
	 */
	public async checkHealth(): Promise<void>{

		const args : IHealthCheckArgs = {
			webApp: true,
			webHost: true, 
			environmentName: this.label
		};
		const isValidArgs = this.clio.healthCheck.canExecute(args);
		if(isValidArgs.success){
			const result = await this.clio.healthCheck.executeAsync(args);
			if(result.success && result.isWebAppHeathy && result.isWebHostHealthy){
				this.setHealthStatus(HealthStatus.healthy);
			} else{
				this.setHealthStatus(HealthStatus.unHealthy);
			}
		}


		// const cmd = `clio hc ${this.label} -a true -h true`;
		// exec(cmd, (error, stdout, stderr )=>{
		// 	if(error){
		// 		this.setHealthStatus(HealthStatus.unHealthy);
		// 	}
		// 	if(stdout){
		// 		let isWebHostOk =  stdout.match(/\tWebHost - OK/);
		// 		let isWebAppLoaderOk = stdout.match(/\tWebAppLoader - OK/);
		// 		if(isWebAppLoaderOk && isWebHostOk){
		// 			this.setHealthStatus(HealthStatus.healthy);
		// 		}else{
		// 			this.setHealthStatus(HealthStatus.unHealthy);
		// 		}
		// 	}
		// 	if(stderr){
		// 		this.setHealthStatus(HealthStatus.unHealthy);
		// 	}
		// });
	}

	
	/**
	 * Restarts web app
	 */
	public async restartWebApp(): Promise<void>{
		this.clioExecutor.executeCommandByTerminal(`restart -e "${this.label}"`);
	}

	/**
	 * Flushes redis
	 */
	public async flushDb(): Promise<void>{
		const args : IFlushDbArgs = {
			environmentName: this.label
		};
		const isArgValid = this.clio.flushDb.canExecute(args);
		if(isArgValid){
			const result = await this.clio.flushDb.executeAsync(args);
			if(result.success){
				vscode.window.showInformationMessage(`Flushdb : ${result.message}`);
			} else if(!result.success){
				vscode.window.showErrorMessage(`Flushdb : ${result.message}`);
			}
		}
	}

	public async openInBrowser(): Promise<void>{
		this.clioExecutor.executeCommandByTerminal(`open -e "${this.label}"`);
	}

	public async executeSql(sqlText: String): Promise<String>{
		const args :ISqlArgs = {
			sqlText: sqlText,
			environmentName: this.label
		};
		const validationResult = this.clio.sql.canExecute(args);

		if(!validationResult.success){
			throw new Error(validationResult.message.toString());
		}

		const result = await this.clio.sql.executeAsync(args);
		if(result.success){
			return result.message;
		} else {
			throw new Error(result.message.toString());
		}
	}

	private setHealthStatus(status: HealthStatus): void {
		switch (status){
			case  HealthStatus.unknown : {
				this.setUnknownHealthIcon();
				break;
			}
			case  HealthStatus.healthy : {
				this.setHealthyIcon();
				break;
			}
			case  HealthStatus.unHealthy : {
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
		this._onDidStatusUpdate?.fire(this);
	}
	private setHealthyIcon(): void {
		this.iconPath= {
			light: path.join(__filename, '..', '..','..', 'resources', 'icon', 'creatio-triangle.svg'),
			dark: path.join(__filename, '..', '..', '..', 'resources', 'icon', 'creatio-triangle.svg')
		};
		this._onDidStatusUpdate?.fire(this);
	}
	private setUnhealthyIcon(): void {
		this.iconPath= {
			light: path.join(__filename, '..', '..','..', 'resources', 'icon', 'creatio-square.svg'),
			dark: path.join(__filename, '..', '..', '..', 'resources', 'icon', 'creatio-square.svg')
		};
		this._onDidStatusUpdate?.fire(this);
	}
}

export enum HealthStatus{
	unknown =0,
	healthy = 1,
	unHealthy = 2
}