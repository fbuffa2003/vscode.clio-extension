import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CatalogComponent } from './catalog/catalog.component';
import { ConnectionComponent } from './connection/connection.component';
import { FeaturesComponent } from './features/features.component';
import { SqlTableComponent } from './sql-table/sql-table.component';
import { WebSocketMessagesComponent } from './web-socket-messages/web-socket-messages.component';

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
	{
		path: 'features' , 
		title : 'features',
		component: FeaturesComponent
	},
	{
		path: 'WebSocketMessages' , 
		title : 'WebSocketMessages',
		component: WebSocketMessagesComponent
	},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
