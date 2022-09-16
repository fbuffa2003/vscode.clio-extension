import * as vscode from 'vscode';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { ClioExecutor } from '../Common/clioExecutor';
import { Clio } from '../commands/Clio';
import { ISqlArgs } from '../commands/SqlCommand';
import { IHealthCheckArgs } from '../commands/HealthCheckCommand';
import { IFlushDbArgs } from '../commands/FlushDbCommand';
import { HealthStatus } from './environmentService';


export class CreatioInstance extends vscode.TreeItem {

	private _onDidStatusUpdate: vscode.EventEmitter<CreatioInstance> = new vscode.EventEmitter<CreatioInstance>();
	readonly onDidStatusUpdate: vscode.Event<CreatioInstance> = this._onDidStatusUpdate.event;
	private _onDeleted: vscode.EventEmitter<CreatioInstance> = new vscode.EventEmitter<CreatioInstance>();
	readonly onDeleted: vscode.Event<CreatioInstance> = this._onDeleted.event;
	private readonly clioExecutor: ClioExecutor;
	private readonly clio: Clio;

	contextValue = 'CreatioInstance';
	private healthStatus: HealthStatus = HealthStatus.unknown;
	
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

	//#region Public methods
	/**
	 * Checks node health
	 */
	public async checkHealth(): Promise<void> {

		const args: IHealthCheckArgs = {
			webApp: true,
			webHost: true,
			environmentName: this.label
		};

		const isValidArgs = this.clio.healthCheck.canExecute(args);
		if (isValidArgs.success) {
			const result = await this.clio.healthCheck.executeAsync(args);
			if (result.success && result.isWebAppHeathy && result.isWebHostHealthy) {
				this.setHealthStatus(HealthStatus.healthy);
			} else {
				this.setHealthStatus(HealthStatus.unHealthy);
			}
		}
	}

	/**
	 * Restarts web app
	 */
	public async restartWebApp(): Promise<void> {
		this.clioExecutor.executeCommandByTerminal(`restart -e "${this.label}"`);
	}

	/**
	 * Flushes redis
	 */
	public async flushDb(): Promise<void> {
		const args: IFlushDbArgs = {
			environmentName: this.label
		};
		const isArgValid = this.clio.flushDb.canExecute(args);
		if (isArgValid) {
			const result = await this.clio.flushDb.executeAsync(args);
			if (result.success) {
				vscode.window.showInformationMessage(`Flushdb : ${result.message}`);
			} else if (!result.success) {
				vscode.window.showErrorMessage(`Flushdb : ${result.message}`);
			}
		}
	}

	/**
	 * Flushes redis
	 */
	public async UnregWebApp(): Promise<void> {
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

	public async openInBrowser(): Promise<void> {
		this.clioExecutor.executeCommandByTerminal(`open -e "${this.label}"`);
	}

	public async installGate(): Promise<void> {
		this.clioExecutor.executeCommandByTerminal(`installgate -e "${this.label}"`);
	}

	public async executeSql(sqlText: String): Promise<String> {
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

	//#endregion

	//#region Private methods
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
			light: path.join(__filename, '..', '..', '..', 'resources', 'icon', 'creatio-circle-white.svg'),
			dark: path.join(__filename, '..', '..', '..', 'resources', 'icon', 'creatio-circle-white.svg')
		};
		this._onDidStatusUpdate?.fire(this);
	}
	private setHealthyIcon(): void {
		this.iconPath = {
			light: path.join(__filename, '..', '..', '..', 'resources', 'icon', 'circle-green-bottom.svg'),
			dark: path.join(__filename, '..', '..', '..', 'resources', 'icon', 'circle-green-bottom.svg')
		};
		this._onDidStatusUpdate?.fire(this);
	}
	private setUnhealthyIcon(): void {
		this.iconPath = {
			light: path.join(__filename, '..', '..', '..', 'resources', 'icon', 'circle-red-bottom.svg'),
			dark: path.join(__filename, '..', '..', '..', 'resources', 'icon', 'circle-red-bottom.svg')
		};
		this._onDidStatusUpdate?.fire(this);
	}
	//#endregion
}