import { Component, HostListener, OnInit } from "@angular/core";
import { provideVSCodeDesignSystem, vsCodeBadge, vsCodeButton, vsCodeCheckbox, vsCodeDataGrid, vsCodeDataGridCell, vsCodeDataGridRow, vsCodeDropdown, vsCodeOption, vsCodePanels, vsCodePanelTab, vsCodePanelView, vsCodeProgressRing } from "@vscode/webview-ui-toolkit";
import { IFeature } from "../features/features.component";
import { VscodeDataProviderService } from "../services/vscode-data-provider.service";

@Component({
	selector: "app-comparer",
	templateUrl: "./comparer.component.html",
	styleUrls: ["./comparer.component.css"],
})
export class ComparerComponent implements OnInit {
	

	@HostListener("window:message", ["$event"])
	onMessage(ev: any) {	
		this.vscodeDataProvider.onMessage(ev);
	}
	
	private _imageUri;
	public environmentName;
	public circleImageUri;
	public _selectedOtherEnvironment : string = '';
	public contentCssClass : string = 'main-content';
	
	private _otherEnvironments : string[] = [];
	public get OtherEnvironments() : string[] {
		return this._otherEnvironments;
	}
	private set OtherEnvironments(v : string[]) {
		this._otherEnvironments = v;
	}

	private _cFeatures : Array<IFeature> = [];
	public get CFeatures() : Array<IFeature> {
		return this._cFeatures;
	}
	private set CFeatures(v : Array<IFeature>) {
		this._cFeatures = v;
	}

	private _oFeatures : Array<IFeature> = [];
	public get OFeatures() : Array<IFeature> {
		return this._oFeatures;
	}
	private set OFeatures(v : Array<IFeature>) {
		this._oFeatures = v;
	}


	public comparer: Comparer | undefined;


	private _loadingMaskVisible : boolean = false;
	public get LoadingMaskVisible() : boolean {
		return this._loadingMaskVisible;
	}
	private set LoadingMaskVisible(v : boolean) {
		this._loadingMaskVisible = v;
		if(v){
			this.contentCssClass = "main-content loading";
		}else{
			this.contentCssClass = "main-content";
		}
	}

	
	constructor(private readonly vscodeDataProvider: VscodeDataProviderService) {

		this._imageUri = history.state.imageUri;
		this.environmentName = history.state.environmentName;
		this.circleImageUri = this._imageUri+'/'+"creatio-square.svg";
		
		provideVSCodeDesignSystem().register(
			vsCodeButton(), vsCodePanels(), vsCodePanelTab(), vsCodePanelView(),
			vsCodeOption(), vsCodeDropdown(), vsCodeCheckbox(),vsCodeProgressRing(),
			vsCodeDataGrid(), vsCodeDataGridRow(), vsCodeDataGridCell(), vsCodeBadge()
		);
	}

	ngOnInit(): void {
		(async ()=>{
			this.OtherEnvironments = await this.vscodeDataProvider.getOtherEnvironments();
			if(this.OtherEnvironments.length>0){
				this._selectedOtherEnvironment = this.OtherEnvironments[0];
			}
		})();
	}

	onChange(item: Event){
		const customEvent:CustomEvent = item as CustomEvent;
		if(customEvent.detail?.value){
			this._selectedOtherEnvironment = customEvent.detail?.value;
		}
	}

	onApply(event: Event){
		(async ()=>{
			this.LoadingMaskVisible = true;
			this.OFeatures  = await this.vscodeDataProvider.getOtherEnvironmentFeatures(this._selectedOtherEnvironment);
			this.CFeatures = await this.vscodeDataProvider.getFeatures();
			this.LoadingMaskVisible = false;
			this.comparer = new Comparer(this.CFeatures, this.OFeatures);

		})();
	}
}


export class Comparer{

	
	private _common : Array<IFeature> = [];
	public get Common() : Array<IFeature> {
		return this._common;
	}
	private set Common(v : Array<IFeature>) {
		this._common = v;
	}
	
	private _current : Array<IFeature>;
	public get Current() : Array<IFeature> {
		return this._current;
	}
	private set Current(v : Array<IFeature>) {
		this._current = v;
	}
	
	private _other : Array<IFeature>;
	public get Other() : Array<IFeature> {
		return this._other;
	}
	private set Other(v : Array<IFeature>) {
		this._other = v;
	}
	
	private _uniqueToCurrent : Array<IFeature> = [];
	public get UniqueToCurrent() : Array<IFeature> {
		return this._uniqueToCurrent;
	}
	private set UniqueToCurrent(v : Array<IFeature>) {
		this._uniqueToCurrent = v;
	}
	
	private _uniqueToOther : Array<IFeature> = [];
	public get UniqueToOther() : Array<IFeature> {
		return this._uniqueToOther;
	}
	private set UniqueToOther(v : Array<IFeature>) {
		this._uniqueToOther = v;
	}
	

	private _diff : Array<IDiffFeature> = [];
	public get Diff() : Array<IDiffFeature> {
		return this._diff;
	}
	private set Diff(v : Array<IDiffFeature>) {
		this._diff = v;
	}
	



	constructor(current: Array<IFeature>, private other: Array<IFeature>) {

		this._current = current;
		this._other = other;
		this.buildCommon();
		this.buildUniqueToCurrent();
		this.buildUniqueToOther();
		this.buildDiff();
		
		console.log(`
			Common: ${this.Common.length}
			Current: ${this.Current.length}
			Other: ${this.Other.length}
			UniqueToCommon: ${this.UniqueToCurrent.length}
			UniqueToOther: ${this.UniqueToOther.length}
			Diff: ${this.Diff.length}
		`);
	}

	/**
	 * remove items from other array when they are of equal value in current array
	 */
	private buildCommon() {

		for(let i: number = 0; i < this.Current.length; i++){

			const currentCode = this.Current[i].Code;
			const currentState = this.Current[i].State;
			const currentStateForCu = this.Current[i].StateForCurrentUser;
			const currentSource = this.Current[i].Source;

			const index: number = this.Other.findIndex(oi=>
				oi.Code === currentCode && 
				oi.State === currentState && 
				oi.StateForCurrentUser === currentStateForCu &&
				oi.Source === currentSource
			);

			if(index !== -1){
				this.Common.push(this.Current[i]);
			}
		}

		this.Common.forEach(common =>{

			const io = this.other.findIndex(o=> o.Code === common.Code);
			if(io !== -1){
				this.other.splice(io,1);
			}
			
			const ic = this.Current.findIndex(c=>c.Code === common.Code);
			if(ic !== -1){
				this.Current.splice(ic,1);
			}
		});
	}

	private buildUniqueToCurrent(){
		for(let i=0; i< this.Current.length; i++){
			const index = this.Other.findIndex(element=> element.Code === this.Current[i].Code);
			if(index === -1){
				this.UniqueToCurrent.push(this.Current[i]);
			}
		}

		this.UniqueToCurrent.forEach((element)=>{
			const i = this.Current.findIndex(e=> e.Code === element.Code);
			this.Current.splice(i,1);
		});
	}
	private buildUniqueToOther(){
		for(let i=0; i< this.Other.length; i++){
			const index = this.Current.findIndex(element=> element.Code === this.Other[i].Code);
			if(index === -1){
				this.UniqueToOther.push(this.Other[i]);
			}
		}

		this.UniqueToOther.forEach((element)=>{
			const i = this.Other.findIndex(e=> e.Code === element.Code);
			this.Other.splice(i,1);
		});
	}

	private buildDiff(){

		
		this.Current.forEach(current=>{

			const code = current.Code;

			const currentDiffItem: IDiffValue = {
				State: current.State,
				StateForCurrentUser: current.StateForCurrentUser,
				Source: current.Source,
				Description: current.Description,
				Id: current.Id
			};

			const other = this.Other.find(o=> o.Code === current.Code);

			if(other) {

				const otherDiffItem: IDiffValue = {
					State: other.State,
					StateForCurrentUser: other.StateForCurrentUser,
					Source: other.Source,
					Description: other.Description,
					Id: other.Id
				};

				const diffItem: IDiffFeature ={
					code: code,
					current: currentDiffItem,
					other: otherDiffItem
				};
				this.Diff.push(diffItem);
			}
		});


		this.Diff.forEach(diff=>{

			const ci = this.Current.findIndex(current=> current.Code === diff.code);
			this.Current.splice(ci, 1);
			
			const oi = this.Current.findIndex(other=> other.Code === diff.code);
			this.Other.splice(oi, 1);
		});

		console.log(`
			There should be nothing left in Current or Other
			Current: ${this.Current.length}
			Other: ${this.Other.length}
		`);
	}
}


export interface IDiffFeature{
	code: string,
	current:IDiffValue,
	other: IDiffValue
}

export interface IDiffValue{
	State: boolean,
	StateForCurrentUser: boolean
	Source: string
	Description: string,
	Id: string
}