import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CatalogComponent } from './catalog/catalog.component';
import { ConnectionComponent } from './connection/connection.component';

const routes: Routes = [
	{
		path: 'catalog/:environmentName' , 
		title : 'catalog',
		component: CatalogComponent
	},
	{
		path: 'connection/:environmentName' , 
		title : 'connection',
		component: ConnectionComponent
	},
	{
		path: 'connection' , 
		title : 'connection',
		component: ConnectionComponent
	},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
