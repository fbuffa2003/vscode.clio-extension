import { Injectable } from "@angular/core";
import { vscode } from "../utilities/vscode";

@Injectable({
	providedIn: "root",
})
export class VscodeDataProviderService {
	constructor() {}

	public async getCatalog(){
		vscode.postMessage({
			command: "getCatalog"
		});
	}
}
