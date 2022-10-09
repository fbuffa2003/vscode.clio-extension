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
				if(this.data[commandName]){
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
				if(this.data[commandName]){
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
				if(this.data[commandName]){
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
				if(this.data[commandName]){
					resolve(this.data[commandName]);
					clearInterval(interval);
				}
			},1000);
		});
	}

}
