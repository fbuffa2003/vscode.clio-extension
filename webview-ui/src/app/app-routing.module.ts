import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CatalogComponent } from './catalog/catalog.component';
import { ConnectionComponent } from './connection/connection.component';
import { SqlTableComponent } from './sql-table/sql-table.component';

const routes: Routes = [
	{
		path: 'catalog' , 
		title : 'catalog',
		component: CatalogComponent
	},
	// {
	// 	path: 'connection/:environmentName' , 
	// 	title : 'connection',
	// 	component: ConnectionComponent
	// },
	{
		path: 'connection' , 
		title : 'connection',
		component: ConnectionComponent
	},
	{
		path: 'sql-table' , 
		title : 'sql table',
		component: SqlTableComponent
	},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
