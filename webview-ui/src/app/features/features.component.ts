import { Component, HostListener, OnInit } from '@angular/core';
import { Checkbox, provideVSCodeDesignSystem, vsCodeButton, vsCodeCheckbox, vsCodeDataGrid, vsCodeDataGridCell, vsCodeDataGridRow, vsCodeProgressRing, vsCodeTextField } from '@vscode/webview-ui-toolkit';
import { VscodeDataProviderService } from '../services/vscode-data-provider.service';

@Component({
  selector: 'app-features',
  templateUrl: './features.component.html',
  styleUrls: ['./features.component.css']
})
export class FeaturesComponent implements OnInit {
	
	private _imageUri;
	public environmentName;
	public circleImageUri;
		
	mainTableCss:string = "main-table";
	
	private _searchValue : string = '';
	public get SearchValue() : string {
		return this._searchValue;
	}
	public set SearchValue(v : string) {
		this._searchValue = v;
	}
	
	
	private _loadingMaskVisible : boolean = false;
	public get LoadingMaskVisible() : boolean {
		return this._loadingMaskVisible;
	}
	private set LoadingMaskVisible(v : boolean) {
		this._loadingMaskVisible = v;
		if(v){
			this.mainTableCss = "main-table loading";
		}else{
			this.mainTableCss = "main-table";
		}
	}
	
	public get Data() : Array<IFeature> {
		if(this.SearchValue.length > 0) {
			return this.UnFilteredData.filter(c=> c.Code.toLowerCase().includes(this.SearchValue.toLowerCase()));
		}
		else{
			return this.UnFilteredData;
		}
	}

	private _unfilteredData : Array<IFeature> = [];
	public get UnFilteredData() : Array<IFeature> {
		return this._unfilteredData;
	}
	public set UnFilteredData(v : Array<IFeature>) {
		this._unfilteredData = v;
	}
	


	@HostListener("window:message", ["$event"])
	onMessage(ev: any) {	
		this.vscodeDataProvider.onMessage(ev);
	}
	constructor(private readonly vscodeDataProvider: VscodeDataProviderService) { 
		provideVSCodeDesignSystem().register(
			vsCodeButton(),vsCodeCheckbox(),vsCodeTextField(), vsCodeProgressRing(),
			vsCodeDataGrid(), vsCodeDataGridRow(), vsCodeDataGridCell()
		);
		this._imageUri = history.state.imageUri;
		this.environmentName = history.state.environmentName;
		this.circleImageUri = this._imageUri+'/'+"creatio-square.svg";
	}

	ngOnInit(): void {

		this.LoadingMaskVisible = true;
		(async ()=>{
			this.UnFilteredData = await this.vscodeDataProvider.getFeatures();
			this.LoadingMaskVisible = false;
		})();
	}
	onStateClick(row: IFeature){
		const item = this.UnFilteredData.find(f=> f.Id === row.Id);
		if(item){
			item.State = !item?.State;
			(async ()=>{
				this.LoadingMaskVisible = true;
				const updatedFeature = await this.vscodeDataProvider.setFeatureState(item);
				//const i = this.UnFilteredData.findIndex(f=> f.Id === row.Id);
				//this.UnFilteredData[i] = updatedFeature;
				item.State = updatedFeature.State;
				item.StateForCurrentUser = updatedFeature.StateForCurrentUser;
				this.LoadingMaskVisible = false;
			})();
		}
	}

	onStateForCurrentUserClick(row: IFeature){
		const item = this.UnFilteredData.find(f=> f.Id === row.Id);
		if(item){
			item.StateForCurrentUser = !item?.StateForCurrentUser;
			(async ()=>{
				this.LoadingMaskVisible = true;
				await this.vscodeDataProvider.setFeatureStateForCurrentUser(item);
				this.LoadingMaskVisible = false;
			})();
		}
	}
}

export interface IFeature {
	Code: string,
	State: boolean,
	StateForCurrentUser: boolean
	Source: string
	Description: string,
	Id: string
}

