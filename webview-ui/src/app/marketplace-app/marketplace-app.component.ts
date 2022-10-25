import { Component, HostListener, Input, OnInit } from "@angular/core";
import {
	provideVSCodeDesignSystem,
	vsCodeButton,
	vsCodeCheckbox,
	vsCodeDataGrid,
	vsCodeDataGridCell,
	vsCodeDataGridRow,
	vsCodeTextField,
} from "@vscode/webview-ui-toolkit";
import { CompatiblePlatform, IMarketplaceApp, ModerationState, ProductCategory } from "../catalog/catalog.component";
import { DbmsCompatibility, IMarketplaceAppDetail, VscodeDataProviderService } from "../services/vscode-data-provider.service";

@Component({
	selector: "app-marketplace-app",
	templateUrl: "./marketplace-app.component.html",
	styleUrls: ["./marketplace-app.component.css"],
})
export class MarketplaceAppComponent implements OnInit {
	
	@Input() MarketplaceApp : IMarketplaceApp | undefined;
	
	private _isExpanded : boolean = false;
	public get IsExpanded() : boolean {
		return this._isExpanded;
	}
	public set IsExpanded(v : boolean) {
		this._isExpanded = v;
	}
	
	
	public id: string = '';
	public internalNid: number = 0;
	public internalVid: number = 0;
	public isCertified: boolean = false;
	public moderationState: ModerationState = ModerationState.upcoming;
	public shortDescription: string = '';
	public title: string = '';
	public path: string = '';

	public imageUrl: string | undefined;

	public details : IMarketplaceAppDetail | undefined;
	public isStarred :boolean = false;
	
	public dbmsString : string | undefined;
	public compatiblePlatformString : string | undefined;
	public productCategoryString : string | undefined;
	
	@HostListener("window:message", ["$event"])
	onMessage(ev: any){
		this.vscodeDataProvider.onMessage(ev);
	}
	
	constructor(private readonly vscodeDataProvider: VscodeDataProviderService) {
		provideVSCodeDesignSystem().register(
			vsCodeButton(),
			vsCodeCheckbox(),
			vsCodeTextField(),
			vsCodeDataGrid(),
			vsCodeDataGridRow(),
			vsCodeDataGridCell()
		);
	}

	ngOnInit(): void {
		if(this.MarketplaceApp){

			this.id = this.MarketplaceApp.id;
			this.internalNid = this.MarketplaceApp.internalNid;
			this.internalVid = this.MarketplaceApp.internalVid;
			this.isCertified = this.MarketplaceApp.isCertified;
			this.moderationState = this.MarketplaceApp.moderationState;
			this.shortDescription = this.MarketplaceApp.shortDescription;
			this.title = this.MarketplaceApp.title;
			this.path = this.MarketplaceApp._path;
			this.imageUrl = undefined;
			this.getIsStarred();
		}
	}

	private getIsStarred(){

		const specialApps: number[] = [23425, 10096, 22966];

		if(specialApps.find(item=> item === this.internalNid)){
			this.isStarred = true;
		}

		if(this.isCertified){
			this.isStarred = true;
		}
	}

	async onExpanded(){
		this.IsExpanded = !this.IsExpanded;
		if(this.IsExpanded && !this.details){
			this.details = await this.vscodeDataProvider.getMarketplaceAppDetails(this.internalNid);
			

			if(this.details.appLogo && this.details.appLogo.length>0){
				this.imageUrl = `https://marketplace.creatio.com${this.details.appLogo}`;
			}else{
				this.imageUrl = undefined;
			}

			this.details.dbms.forEach(d=>{
				this.dbmsString= '';
				this.dbmsString += `${DbmsCompatibility[d]} `;
			});

			this.details.platform.forEach(p=>{
				this.compatiblePlatformString = '';
				this.compatiblePlatformString += `${CompatiblePlatform[p]} `;
			});

			this.productCategoryString =  ProductCategory[this.details.productCategory];
		}
	}
}