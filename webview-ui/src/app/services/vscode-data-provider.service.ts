import { Injectable, HostListener } from "@angular/core";
import { vscode } from "../utilities/vscode";


@Injectable({
	providedIn: "root",
})
export class VscodeDataProviderService {
	constructor() {}

	private data : any|undefined;

	onMessage(ev: any) {
		console.log(`data arrived: ${ev.data}`);
		this.data = ev.data;
	}


	public async getCatalog() : Promise<any>{
		
		return new Promise<any>((resolve, reject)=>{
			const commandName = "getCatalog";
			vscode.postMessage({
				command: commandName
			});

			console.log("waiting for data");
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
			console.log("waiting for data");
			var interval = setInterval(()=>{
				if(this.data[commandName]){
					resolve(this.data[commandName]);
					clearInterval(interval);
				}
			},1000);
		});
	}

}
