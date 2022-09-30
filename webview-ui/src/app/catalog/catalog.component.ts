import { Component, OnInit, HostListener, Input } from '@angular/core';
import { vscode } from "./../utilities/vscode";
import { provideVSCodeDesignSystem, TextField, vsCodeButton, vsCodeCheckbox, vsCodeDataGrid, vsCodeDataGridCell, vsCodeDataGridRow, vsCodeTextField } from "@vscode/webview-ui-toolkit";
import { VscodeDataProviderService } from '../services/vscode-data-provider.service';


@Component({
	selector: "app-catalog",
	templateUrl: "./catalog.component.html",
	styleUrls: ["./catalog.component.css"],
})
export class CatalogComponent implements OnInit {
	
	public unFilteredCatalog : Array<CatalogItem> = new Array<CatalogItem>();
	public catalog : Array<CatalogItem> = this.unFilteredCatalog;

	private imageUri;
	public environmentName;
	public circleImageUri;


	@HostListener("window:message", ["$event"])
	onMessage(ev: any) {
		let data = ev.data;
		if(data.getCatalog){
			this.onGetCatalog(data.getCatalog);
		}
	}

	/**
	 * Parses catalog into model 
	 * @param catalog data from clio
	 */
	private onGetCatalog(catalog: string){
		const lines: string[] = catalog.split("\r\n");
		lines.forEach(line=>{
			const m = line.match(/\d{4,6}/);
			if(m){
				let id = Number.parseInt(m[0]);
				let name = line.substring(m[0].length, line.length-m[0].length).trim();
				let item = new CatalogItem(id, name);
				this.unFilteredCatalog?.push(item);
			}
		});
		this.catalog = this.unFilteredCatalog;
	}

	constructor(private vscodeDataProvider: VscodeDataProviderService) {
		provideVSCodeDesignSystem().register(
			vsCodeButton(), vsCodeCheckbox(), vsCodeTextField(),
			vsCodeDataGrid(), vsCodeDataGridRow(), vsCodeDataGridCell()
		);

		this.imageUri = history.state.imageUri;
		this.environmentName = history.state.environmentName;
		this.circleImageUri = this.imageUri+'/'+"creatio-square.svg";
		console.log(`catalog.component.ts environmentName: ${this.environmentName}`);
	}
	ngOnInit(): void {
		//Ask extension to run clio catalog

		(async ()=>await this.vscodeDataProvider.getCatalog())();

		// vscode.postMessage({
		// 	command: "getCatalog",
		// 	environmentName: this.environmentName
		// });
	}

	public search(inputEl : HTMLElement ): void{
		const searchData = (inputEl as TextField).value;
		this.catalog = this.unFilteredCatalog.filter(c=> c.name.toLowerCase().includes(searchData.toLowerCase()));
	}

	public install(appId: number){
		console.log(`Installing app with id : ${appId}`);
		//Ask extension to run clio catalog
		vscode.postMessage({
			command: "install",
			environmentName: this.environmentName,
			appId: appId
		});
	}

}

export class CatalogItem{
	
	public id: number;
	public name: string;

	constructor(id: number, name : string) {
		this.id = id;
		this.name = name;
	}
}