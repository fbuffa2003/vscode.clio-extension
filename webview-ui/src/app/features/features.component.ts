import { Component, HostListener, OnInit } from '@angular/core';
import { allComponents, DataGrid, provideVSCodeDesignSystem, vsCodeButton, vsCodeCheckbox, vsCodeDataGrid, vsCodeDataGridCell, vsCodeDataGridRow } from '@vscode/webview-ui-toolkit';

@Component({
  selector: 'app-features',
  templateUrl: './features.component.html',
  styleUrls: ['./features.component.css']
})
export class FeaturesComponent implements OnInit {

	private readonly innerHtml = `<vscode-data-grid id='features-data-grid' generate-header="sticky"></vscode-data-grid>`;
	public data : Array<IFeature> = [];

	@HostListener("window:message", ["$event"])
	onMessage(ev: any) {	
		this.onGetJsonData(ev.data);
	}
	constructor() { 
		provideVSCodeDesignSystem().register(
			vsCodeButton(),vsCodeCheckbox(),
			vsCodeDataGrid(), vsCodeDataGridRow(), vsCodeDataGridCell()
		);
	}

	ngOnInit(): void {
		//this.data = this.mockData;
		this.renderTable();
	}

	private onGetJsonData(data : any){
		this.data = data;
		//this.renderTable();
	}

	private renderTable(){
		const wrapper = document.getElementById('wrapper') as HTMLElement;
		wrapper.innerHTML = this.innerHtml;
		let sqlGrid = document.getElementById('features-data-grid') as DataGrid;
		sqlGrid.rowsData = this.data;
	}


	private mockData: IFeature[] = [
		{
			"Code": "AllowGeneralUserPasswordRecovery",
			"State": true,
			"StateForCurrentUser": false,
			"Source": "GlobalAppSettings",
			"Description": "",
			"Id": "0c747c78-a848-4a0d-9848-49dd7bdc25bd"
		},
		{
			"Code": "AllowOnlyOneSessionPerUser",
			"State": true,
			"StateForCurrentUser": false,
			"Source": "GlobalAppSettings",
			"Description": "",
			"Id": "8b323f7e-28af-437c-ade7-95702ef2587f"
		}
	];

}

export interface IFeature {
	Code: string,
	State: boolean,
	StateForCurrentUser: boolean
	Source: string
	Description: string,
	Id: string
}

