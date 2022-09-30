import { Component, HostListener, OnInit } from '@angular/core';
import { ColDef } from 'ag-grid-community';


@Component({
	selector: 'app-sql-table',
	templateUrl: './sql-table.component.html',
	styleUrls: ['./sql-table.component.css']
})
export class SqlTableComponent implements OnInit {

	public rowData = [];
	public columnDefs: ColDef[] = [];

	@HostListener("window:message", ["$event"])
	onMessage(ev: any) {	
		const keys = Object.keys(ev.data[0]);
		this.columnDefs = this.buildColDef(keys);
		this.rowData = ev.data;
	}
	
	ngOnInit(): void {}

	/**
	 * {@link https://ag-grid.com/angular-data-grid/column-definitions See angular data grid: Column Definitions}
	 * @param keys DataSource array of columns
	 * @returns Configuration options for columns in AG Grid.
	 */
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
