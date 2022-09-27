import { Component, HostListener, OnInit, Output } from '@angular/core';
import { DataGrid, provideVSCodeDesignSystem, vsCodeButton, vsCodeDataGrid, vsCodeDataGridCell, vsCodeDataGridRow } from '@vscode/webview-ui-toolkit';

@Component({
	selector: 'app-sql-table',
	templateUrl: './sql-table.component.html',
	styleUrls: ['./sql-table.component.css']
})
export class SqlTableComponent implements OnInit {

	private readonly innerHtml = `<vscode-data-grid id='sql-data-grid' generate-header="sticky"></vscode-data-grid>`;
	public data : Array<any> = [];

	@HostListener("window:message", ["$event"])
	onMessage(ev: any) {	
		//console.log("SQL TABLE MESSAGE ARRAIVED");
		//console.log(ev.data);
		this.onGetJsonData(ev.data);
	}
	
	constructor() {
		provideVSCodeDesignSystem().register(vsCodeButton(),vsCodeDataGrid(), vsCodeDataGridRow(), vsCodeDataGridCell());
	}

	ngOnInit(): void {
		this.renderTable();
	}

	private onGetJsonData(data : any){
		this.data = data;
		this.renderTable();
	}

	private renderTable(){
		const wrapper = document.getElementById('wrapper') as HTMLElement;
		wrapper.innerHTML = this.innerHtml;
		let sqlGrid = document.getElementById('sql-data-grid') as DataGrid;
		sqlGrid.rowsData = this.data;
	}
}
