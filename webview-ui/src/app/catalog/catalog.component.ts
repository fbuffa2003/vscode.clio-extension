import { Component, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { vscode } from "./../utilities/vscode";
import { provideVSCodeDesignSystem, vsCodeButton, vsCodeCheckbox, vsCodeDataGrid, vsCodeDataGridCell, vsCodeDataGridRow } from "@vscode/webview-ui-toolkit";


provideVSCodeDesignSystem().register(
	vsCodeButton(), vsCodeCheckbox(), 
	vsCodeDataGrid(), vsCodeDataGridRow(), vsCodeDataGridCell()
);

@Component({
	selector: "app-catalog",
	templateUrl: "./catalog.component.html",
	styleUrls: ["./catalog.component.css"],
})
export class CatalogComponent implements OnInit {
	
	public catalog : Array<CatalogItem> = new Array<CatalogItem>();

	@HostListener("window:message", ["$event"])
	onMessage(ev: any) {
		let data = ev.data;
		if(data.getCatalog){
			console.log('Data Arrived');
			console.log(data.getCatalog);
			this.onGetCatalog(data.getCatalog);
		}
	}

	/**
	 * Parses catalog into model 
	 * @param catalog data from clio
	 */
	private onGetCatalog(catalog: string){
		console.log("Catalog data arrived");
		const lines: string[] = catalog.split("\r\n");
		
		debugger;
		lines.forEach(line=>{
			const m = line.match(/\d{4,6}/);
			if(m){
				let id = Number.parseInt(m[0]);
				let name = line.substring(m[0].length, line.length-m[0].length).trim();
				let item = new CatalogItem(id, name);
				this.catalog?.push(item);
			}
		});

		debugger;
	}

	environmentName: string | undefined;
	constructor(private _activatedRoute: ActivatedRoute) {
		this._activatedRoute.paramMap.subscribe((params) => {
			this.environmentName = params.get("environmentName") ?? "";
		});
		
	}
	ngOnInit(): void {

		//Ask extension to run clio catalog
		vscode.postMessage({
			command: "getCatalog",
			environmentName: this.environmentName
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



