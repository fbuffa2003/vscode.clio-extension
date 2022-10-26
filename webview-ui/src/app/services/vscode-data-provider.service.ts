import { Injectable, HostListener } from "@angular/core";
import { IFeature } from "../features/features.component";
import { vscode } from "../utilities/vscode";


@Injectable({
	providedIn: "root",
})
export class VscodeDataProviderService {
	constructor() {}

	private data : any|undefined;
	onMessage(ev: any) {
		this.data = ev.data;
	}


	public async getCatalog() : Promise<any>{
		return new Promise<any>((resolve, reject)=>{
			const commandName = "getCatalog";
			vscode.postMessage({
				command: commandName
			});
			var interval = setInterval(()=>{
				if(this.data && this.data[commandName]){
					resolve(this.data[commandName]);
					clearInterval(interval);
				}
			},1000);
		});
	}
	public async getFeatures() : Promise<any>{
		return new Promise<any>((resolve, reject)=>{
			const commandName = "getFeatures";
			vscode.postMessage({
				command: commandName
			});
			var interval = setInterval(()=>{
				if(this.data && this.data[commandName]){
					resolve(this.data[commandName]);
					clearInterval(interval);
				}
			},1000);
		});
	}

	public async setFeatureStateForCurrentUser(feature : IFeature) : Promise<any>{
		return new Promise<any>((resolve, reject)=>{
			const commandName = "setFeatureStateForCurrentUser";
			vscode.postMessage({
				command: commandName,
				feature: feature
			});
			var interval = setInterval(()=>{
				if(this.data && this.data[commandName]){
					resolve(this.data[commandName]);
					clearInterval(interval);
				}
			},1000);
		});
	}
	public async setFeatureState(feature : IFeature) : Promise<IFeature>{
		return new Promise<any>((resolve, reject)=>{
			const commandName = "setFeatureState";
			vscode.postMessage({
				command: commandName,
				feature: feature
			});
			var interval = setInterval(()=>{
				if(this.data && this.data[commandName]){
					resolve(this.data[commandName]);
					clearInterval(interval);
				}
			},1000);
		});
	}
	public async getOtherEnvironments() : Promise<string[]>{
		return new Promise<any>((resolve, reject)=>{
			const commandName = "getOtherEnvironments";
			vscode.postMessage({
				command: commandName
			});
			var interval = setInterval(()=>{
				if(this.data && this.data[commandName]){
					resolve(this.data[commandName]);
					clearInterval(interval);
				}
			},1000);
		});
	}

	public async getOtherEnvironmentFeatures(environmentName : string) : Promise<IFeature[]>{
		return new Promise<any>((resolve, reject)=>{
			const commandName = "getOtherEnvironmentFeatures";
			vscode.postMessage({
				command: commandName,
				environmentName: environmentName
			});
			var interval = setInterval(()=>{
				if(this.data && this.data[commandName]){
					resolve(this.data[commandName]);
					clearInterval(interval);
				}
			},1000);
		});
	}
	
	public startLogBroadcast(environmentName : string, logLevel: LogLevel, loggerPattern:string): void{
		const commandName = "startLogBroadcast";
		vscode.postMessage({
			command: commandName,
			environmentName: environmentName,
			logLevel: LogLevel[logLevel],
			loggerPattern: loggerPattern
		});
	}
	public stopLogBroadcast(environmentName : string): void {
		const commandName = "stopLogBroadcast";
		vscode.postMessage({
			command: commandName,
			environmentName: environmentName
		});
	}

	public async getMarketplaceAppDetails(nid: number) : Promise<IMarketplaceAppDetail>{
		
		return new Promise<any>((resolve, reject)=>{
			const commandName = "getMarketplaceAppDetails";
			vscode.postMessage({
				command: commandName,
				internalNid: nid
			});
			var interval = setInterval(()=>{
				if(this.data && this.data[commandName]){
					resolve(this.data[commandName] as IMarketplaceAppDetail);
					clearInterval(interval);
				}
			},100);
		});
	}
}


export enum LogLevel{
	ALL,
	Debug,
	Error,
	Fatal,
	Info,
	Trace,
	Warn
}


export interface IMarketplaceAppDetail{
	languages : string[];
	developer: string | undefined;
	dbms: DbmsCompatibility[];
	map: string[];
	productCategory: ProductCategory;
	compatibility: string[];
	minVersion: string;
	platform: CompatiblePlatform[];
	appLogo: string
}

export enum DbmsCompatibility{
	Unknown = 0,
	All = 1,
	MsSql = 2,
	Oracle = 3,
	PgSql = 4
}

export enum ProductCategory{
	Unknown = 0,
	SoftwareSolution = 1,
	Connector = 2,
	AddOn = 3
}

export enum CompatiblePlatform{
	Unknown = 0,
	All = 1,
	NetCore = 2,
	NetFramework=3
}