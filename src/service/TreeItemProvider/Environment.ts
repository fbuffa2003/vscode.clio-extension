import * as vscode from 'vscode';
import path = require('path');
import { HealthStatus } from '../../common/Enums';
import { PackageList } from './PackageList';
import { ProcessList } from './ProcessList';
import { EntityList } from './EntityList';
import { CreatioTreeItem } from "./CreatioTreeItem";
import { ItemType } from "./ItemType";
import { IHealthCheckArgs } from '../../commands/HealthCheckCommand';
import { CreatioClient, IFeature, IWebSocketMessage } from '../../common/CreatioClient/CreatioClient';
import { ClioExecutor } from '../../Common/clioExecutor';
import { IRestoreConfigurationArgs } from '../../commands/RestoreConfiguration';
// import { Clio } from '../../commands/Clio';
import { IFlushDbArgs } from '../../commands/FlushDbCommand';
import { ISqlArgs } from '../../commands/SqlCommand';
import WebSocket = require('ws');
import { LogLevel } from '../../common/CreatioClient/enums';

export class Environment extends CreatioTreeItem {
	private _onWebSocketMessage: vscode.EventEmitter<IWebSocketMessage > = new vscode.EventEmitter<IWebSocketMessage>();
	readonly onWebSocketMessage: vscode.Event<IWebSocketMessage> = this._onWebSocketMessage.event;

	private healthStatus: HealthStatus = HealthStatus.unknown;
	public readonly connectionSettings : IConnectionSettings;
	public creatioClient: CreatioClient;
	private readonly clioExecutor: ClioExecutor = new ClioExecutor();
	public contextValue = 'CreatioInstance';

	private _isStopRequested: boolean = false;
	private _wsClient : WebSocket.WebSocket | undefined;

	private _isSubscribed:boolean = false;


	private _logLevel: LogLevel = LogLevel.Info;
	private _loggerPattern : string = 'ExceptNoisyLoggers';


	constructor( label: string, connectionSettings :IConnectionSettings)
	{
		super(label, connectionSettings.uri.toString(), 
			ItemType.creatioInstance, undefined, vscode.TreeItemCollapsibleState.Collapsed);

		this.connectionSettings = connectionSettings;
		this.items.push(new PackageList(this));
		// this.items.push(new ProcessList(this));
		// this.items.push(new EntityList(this));
		this.creatioClient = new CreatioClient(connectionSettings.uri, connectionSettings.login, connectionSettings.password, connectionSettings.isNetCore);
		this.setHealthStatus(HealthStatus.unknown);
		this.checkHealth();
	}

	//#region Public methods
	
	/**
	* Checks creatio health
	*/
	public async checkHealth(): Promise<void> {

		const args: IHealthCheckArgs = {
			webApp: true,
			webHost: true,
			environmentName: this.label
		};

		if(this.clio.healthCheck.canExecute(args).success){
			const result = await this.clio.healthCheck.executeAsync(args);
			if (result.success && result.isWebAppHeathy && result.isWebHostHealthy) {
				this.setHealthStatus(HealthStatus.healthy);
			} else {
				this.setHealthStatus(HealthStatus.unHealthy);
			}
		}
	}

	/**
	* Restore configuration
	*/
	public async restoreConfiguration(): Promise<void> {
		const args: IRestoreConfigurationArgs = {
			environmentName: this.label
		};
		
		if (this.clio.restoreConfiguration.canExecute(args).success) {
			const result = await this.clio.restoreConfiguration.executeAsync(args);
			if (result.success) {
				vscode.window.showInformationMessage(`Restore configuration : ${result.message}`);
			} else if (!result.success) {
				vscode.window.showErrorMessage(`Restore configuration : ${result.message}`);
			}
		}
	}

	/**
	 * Flushes redis
		*/
	public async unregisterWebApp(): Promise<void> {
		const args: IFlushDbArgs = {
			environmentName: this.label
		};
		const isArgValid = this.clio.unregWebApp.canExecute(args);
		if (isArgValid) {
			const result = await this.clio.unregWebApp.executeAsync(args);
			if (result.success) {
				this._onDeleted?.fire(this);
				vscode.window.showInformationMessage(`Unreg web app : ${result.message}`);
			} else if (!result.success) {
				vscode.window.showErrorMessage(`Unreg web app : ${result.message}`);
			}
		}
	}

	/**
	 * Flushes redis
	 */
	public async flushDb(): Promise<void> {
		const args: IFlushDbArgs = {
			environmentName: this.label
		};

		if (this.clio.flushDb.canExecute(args).success) {
			const result = await this.clio.flushDb.executeAsync(args);
			if (result.success) {
				vscode.window.showInformationMessage(`Flushdb : ${result.message}`);
			} else if (!result.success) {
				vscode.window.showErrorMessage(`Flushdb : ${result.message}`);
			}
		}
	}

	/**
	 * Restarts web app
	 */
	 public async restartWebApp(): Promise<void> {
		this.clioExecutor.executeCommandByTerminal(`restart -e "${this.label}"`);
	}

	public async openInBrowser(): Promise<void> {
		this.clioExecutor.executeCommandByTerminal(`open -e "${this.label}"`);
	}

	public async installGate(): Promise<void> {
		this.clioExecutor.executeCommandByTerminal(`installgate "${this.label}"`);
	}

	public async installPackage(filePath: String): Promise<void> {
		this.clioExecutor.executeCommandByTerminal(`push-pkg "${filePath}" -e "${this.label}"`);
	}

	public async executeSql(sqlText: String): Promise<String> {
		
		const rresult = await this.creatioClient.ExecuteSqlScript(sqlText as string);
		const json = JSON.parse(JSON.parse(rresult.body));
		return JSON.stringify(json);

		//TODO: lines below are temporarely commented out untill clio-cli can return json
		const args: ISqlArgs = {
			sqlText: sqlText,
			environmentName: this.label
		};
		const validationResult = this.clio.sql.canExecute(args);

		if (!validationResult.success) {
			throw new Error(validationResult.message.toString());
		}

		const result = await this.clio.sql.executeAsync(args);
		if (result.success) {
			return result.message;
		} else {
			throw new Error(result.message.toString());
		}
	}
	public async getFeatures(): Promise<IFeature[]>{
		return this.creatioClient.GetFeatures();
	}

	public async setFeatureState(feature : IFeature): Promise<IFeature>{
		return this.creatioClient.SetFeatureState(feature);
	}

	public async setFeatureStateForCurrentUser(feature: IFeature): Promise<IFeature>{
		return this.creatioClient.SetFeatureStateForCurrentUser(feature);
	}

	/**
	 * Start listening to WebSocket message
	 */
	private Listen(){
		//let client : WebSocket;
		vscode.window.withProgress(
			{
				location : vscode.ProgressLocation.Notification,
				title: "Connecting to websocket...",
				cancellable: true
			},
			async(progress, token)=>{
				this._isStopRequested = false;
				this._wsClient = await this.creatioClient.Listen();
				
				this.addEventHandlers(this._wsClient);
				// if(!this._isSubscribed){
				// 	this._isSubscribed = true;
				// }

				progress.report({ 
					increment: 100, 
					message: "Connected" 
				});

				token.onCancellationRequested(_=>{
					progress.report({ 
						increment: 100, 
						message: "Cancelled" 
					});
				});
			}
		);
	}

	public StopListening(){
		this._isStopRequested = true;
		if(this._isStopRequested && this._wsClient && this._wsClient.readyState === WebSocket.OPEN){
			this._wsClient.close();
		}
	}

	public async StartLogBroadcast(logLevel: LogLevel, loggerPattern: string){
		
		this._logLevel = logLevel;
		this._loggerPattern = loggerPattern;
		
		this.Listen();
		await this.creatioClient.StartLogBroadcast(this._logLevel, this._loggerPattern);
	}
	public async StopLogBroadcast(){
		await this.creatioClient.StopLogBroadcast();
		this.StopListening();
	}

	//#endregion

	//#region Methods : Private
	private setHealthStatus(status: HealthStatus): void {
		switch (status) {
			case HealthStatus.unknown: {
				this.setUnknownHealthIcon();
				break;
			}
			case HealthStatus.healthy: {
				this.setHealthyIcon();
				break;
			}
			case HealthStatus.unHealthy: {
				this.setUnhealthyIcon();
				break;
			}
		}
		this.healthStatus = status;
	}
	private setUnknownHealthIcon(): void {
		this.iconPath = {
			light: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'creatio-circle-white.svg'),
			dark: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'creatio-circle-white.svg')
		};
		this._onDidStatusUpdate?.fire(this);
	}
	private setHealthyIcon(): void {
		this.iconPath = {
			light: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'circle-green-bottom.svg'),
			dark: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'circle-green-bottom.svg')
		};
		this._onDidStatusUpdate?.fire(this);
	}
	private setUnhealthyIcon(): void {
		this.iconPath = {
			light: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'circle-red-bottom.svg'),
			dark: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'circle-red-bottom.svg')
		};
		this._onDidStatusUpdate?.fire(this);
	}
	
	/**
	 * 
	 * @param client WebSocket client that we are adding event listeners to
	 */
	private addEventHandlers(client : WebSocket){
		client.on('message', (data: WebSocket.RawData)=>{
			const wsMsg = JSON.parse(data.toString()) as IWebSocketMessage;
			if (wsMsg && wsMsg.Body){
				try	{
					wsMsg.Body = JSON.parse(wsMsg.Body);
				}
				catch(error: any){
					console.log("Error parsing JSON L286");
					//console.log(error);
				}
				this._onWebSocketMessage.fire(wsMsg);
			}
		});
		
		client.on('close', (code: number)=>{
			if(this._isStopRequested){
				this.StopListening();
			}else{
				const timer = setInterval(async ()=>{
					if(client.CLOSED){
						clearInterval(timer);
						await this.StopLogBroadcast();
						//this.Listen();
						await this.StartLogBroadcast(this._logLevel, this._loggerPattern);
					}
				},1000);
			}
		});
		
	}
	//#endregion
}


/**
 * Describes clio app in appsettings.json
 */
export interface IConnectionSettings {
	uri: URL,
	login: string
	password: string,
	maintainer: string,
	isNetCore: boolean,
	isSafe: boolean,
	isDeveloperMode: boolean
}
