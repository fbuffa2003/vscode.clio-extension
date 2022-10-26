import { Component, OnInit, HostListener} from '@angular/core';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import { vscode } from "./../utilities/vscode";
import { provideVSCodeDesignSystem, TextField, vsCodeButton, vsCodeCheckbox, vsCodeDataGrid, vsCodeDataGridCell, vsCodeDataGridRow, vsCodeTag, vsCodeTextField } from "@vscode/webview-ui-toolkit";
import { VscodeDataProviderService } from '../services/vscode-data-provider.service';

@Component({
	selector: "app-catalog",
	templateUrl: "./catalog.component.html",
	styleUrls: ["./catalog.component.css"],
})
export class CatalogComponent implements OnInit {
	
	public unFilteredCatalog : Array<IMarketplaceApp> = new Array<IMarketplaceApp>();
	public catalog : Array<IMarketplaceApp> = this.unFilteredCatalog;

	public selectedApps : number[]=[];

	public selectedAppsString : string;

	private imageUri;
	public environmentName;
	public circleImageUri;

	@HostListener("window:message", ["$event"])
	onMessage(ev: any){
		this.vscodeDataProvider.onMessage(ev);
	}

	/**
	 * Parses catalog into model 
	 * @param catalog data from clio
	 */
	private onGetCatalog(catalog: IMarketplaceApp[]){
		
		this.unFilteredCatalog = catalog;
		
		// const lines: string[] = catalog.split("\r\n");
		// lines.forEach(line=>{
		// 	const m = line.match(/\d{4,6}/);
		// 	if(m){
		// 		let id = Number.parseInt(m[0]);
		// 		let name = line.substring(m[0].length, line.length-m[0].length).trim();
		// 		let item = new CatalogItem(id, name);
		// 		this.unFilteredCatalog?.push(item);
		// 	}
		// });
		this.catalog = this.unFilteredCatalog;
	}

	constructor(private readonly vscodeDataProvider: VscodeDataProviderService) {
		provideVSCodeDesignSystem().register(
			vsCodeButton(), vsCodeCheckbox(), vsCodeTextField(),vsCodeTag(),
			vsCodeDataGrid(), vsCodeDataGridRow(), vsCodeDataGridCell()
		);

		this.imageUri = history.state.imageUri;
		this.environmentName = history.state.environmentName;
		this.circleImageUri = this.imageUri+'/'+"creatio-square.svg";
		this.selectedAppsString = '';
	}
	ngOnInit(): void {
		//Ask extension to run clio catalog
		(async ()=>{
			const data = await this.vscodeDataProvider.getCatalog();
			this.onGetCatalog(data);
		})();
	}

	public search(inputEl : HTMLElement ): void{
		const searchData = (inputEl as TextField).value;
		this.catalog = this.unFilteredCatalog.filter(c=> c.title.toLowerCase().includes(searchData.toLowerCase()));
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


	public onSelectedForInstall(nid: number){
		const _tempIndex = this.selectedApps.findIndex(app=> app === nid);
		if(_tempIndex===-1){
			this.selectedApps.push(nid);
		}
	}
	public removeFromSelectedApps(nid: number){
		const _tempIndex = this.selectedApps.findIndex(app=> app === nid);
		if(_tempIndex !==1){
			this.selectedApps.splice(_tempIndex, 1);
		}
	}
	drop(event: CdkDragDrop<number[]>) {
		moveItemInArray(this.selectedApps, event.previousIndex, event.currentIndex);
	}
}

export interface IMarketplaceApp {
	id: string;
	internalNid: number;
	internalVid: number;
	isCertified: boolean;
	moderationState: ModerationState
	shortDescription: string;
	longDescription: string;
	title: string;
	_path: string;
	totalViews: number;
	totalDownloads: number;
}

export enum ModerationState{
	published = 0,
	upcoming = 1
}

export enum DbmsCompatibility{
	Unknown = 0,
	All = 1,
	MsSql = 2,
	Oracle = 3,
	PgSql = 4
}

export enum CompatiblePlatform{
	Unknown = 0,
	All = 1,
	NetCore = 2,
	NetFramework=3
}

export enum ProductCategory{
	Unknown = 0,
	SoftwareSolution = 1,
	Connector = 2,
	AddOn = 3
}

export class CatalogItem {
	
	public id: number;
	public name: string;

	constructor(id: number, name : string) {
		this.id = id;
		this.name = name;
	}
}