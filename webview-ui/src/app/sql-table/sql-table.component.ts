import { Component, HostListener, OnInit, Output } from '@angular/core';
import { DataGrid, provideVSCodeDesignSystem, vsCodeButton, vsCodeDataGrid, vsCodeDataGridCell, vsCodeDataGridRow } from '@vscode/webview-ui-toolkit';
import { CellClickedEvent, ColDef, GridReadyEvent } from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';


@Component({
	selector: 'app-sql-table',
	templateUrl: './sql-table.component.html',
	styleUrls: ['./sql-table.component.css']
})
export class SqlTableComponent implements OnInit {

	// private readonly innerHtml = `<vscode-data-grid id='sql-data-grid' generate-header="sticky"></vscode-data-grid>`;
	// public data : Array<any> = [];




	// rowData = [
	// 	{ make: 'Toyota',  model: 'Celica', price: 35000 , Id:"66666677777777777777777777666666666666666666777777777777777777776666666666666666667777777777777777777766666666666666666677777777777777777777666666666666", email:"66666666666666666666666666666"},
	// 	{ make: 'Ford',    model: 'Mondeo', price: 32000 },
	// 	{ make: 'Porsche', model: 'Boxster', price: 72000 },
	// 	{ make: 'Porsche', model: 'Boxster', price: 72000 },
	// 	{ make: 'Porsche', model: 'Boxster', price: 72000 },
	// 	{ make: 'Porsche', model: 'Boxster', price: 72000 },
	// 	{ make: 'Porsche', model: 'Boxster', price: 72000 },
		
	// ];
	
	// public columnDefs: ColDef[] = [
	// 	{ field: 'Id', resizable: true, sortable: true},
	// 	{ field: 'Email', resizable: true, sortable: true},
	// 	{ field: 'make', resizable: true, sortable: true},
	// 	{ field: 'model', resizable: true, sortable: true},
	// 	{ field: 'price', resizable: true,sortable: true}
	//   ];

	public rowData = [];
	public columnDefs: ColDef[] = [];

	@HostListener("window:message", ["$event"])
	onMessage(ev: any) {	
		console.log("SQL TABLE MESSAGE ARRAIVED");
		//console.log(ev.data);
		const keys = Object.keys(ev.data[0]);
		this.columnDefs = this.buildColDef(keys);
		this.rowData = ev.data;
		//this.onGetJsonData(ev.data);
	}
	
	// constructor() {
	// 	provideVSCodeDesignSystem().register(vsCodeButton(),vsCodeDataGrid(), vsCodeDataGridRow(), vsCodeDataGridCell());
	// }

	ngOnInit(): void {
	//	this.renderTable();
	}

	// private onGetJsonData(data : any){
	// 	this.data = data;
	// 	this.renderTable();
	// }

	// private renderTable(){
	// 	const wrapper = document.getElementById('wrapper') as HTMLElement;
	// 	wrapper.innerHTML = this.innerHtml;
	// 	let sqlGrid = document.getElementById('sql-data-grid') as DataGrid;
	// 	sqlGrid.rowsData = this.data;
	// }


	private buildColDef(keys: string[]): ColDef[]{
		const result : ColDef[] = [];
		keys.forEach(key => {
			const colDefItem : ColDef = {
				field: key,
				resizable: true,
				sortable: true
			};
			result.push(colDefItem);
		});
		return result;
	}
}
