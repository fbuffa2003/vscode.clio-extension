import { Component, HostListener, OnInit } from '@angular/core';
import { provideVSCodeDesignSystem, TextField, vsCodeButton, vsCodeCheckbox, vsCodeDataGrid, vsCodeDataGridCell, vsCodeDataGridRow, vsCodeTextField } from '@vscode/webview-ui-toolkit';
import { VscodeDataProviderService } from '../services/vscode-data-provider.service';

@Component({
  selector: 'app-features',
  templateUrl: './features.component.html',
  styleUrls: ['./features.component.css']
})
export class FeaturesComponent implements OnInit {
		
	public unFilteredData : Array<IFeature> = [];
	public data : Array<IFeature> = this.unFilteredData;
	
	private _imageUri;
	public environmentName;
	public circleImageUri;
	

	@HostListener("window:message", ["$event"])
	onMessage(ev: any) {	
		this.vscodeDataProvider.onMessage(ev);
	}
	constructor(private readonly vscodeDataProvider: VscodeDataProviderService) { 
		provideVSCodeDesignSystem().register(
			vsCodeButton(),vsCodeCheckbox(),vsCodeTextField(),
			vsCodeDataGrid(), vsCodeDataGridRow(), vsCodeDataGridCell()
		);
		this._imageUri = history.state.imageUri;
		this.environmentName = history.state.environmentName;
		this.circleImageUri = this._imageUri+'/'+"creatio-square.svg";
	}

	ngOnInit(): void {
		//Ask extension to run clio catalog
		(async ()=>{
			const data = await this.vscodeDataProvider.getFeatures();
			this.unFilteredData = data;
			this.data = this.unFilteredData;
		})();
	}

	public search(inputEl : HTMLElement ): void{
		const searchData = (inputEl as TextField).value;
		this.data = this.unFilteredData.filter(c=> c.Code.toLowerCase().includes(searchData.toLowerCase()));
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

