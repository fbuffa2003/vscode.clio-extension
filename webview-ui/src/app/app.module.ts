import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BrowserModule } from '@angular/platform-browser';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CatalogComponent } from './catalog/catalog.component';
import { ConnectionComponent } from './connection/connection.component';
import { SqlTableComponent } from './sql-table/sql-table.component';
import { FeaturesComponent } from './features/features.component';
import { VscodeDataProviderService } from "./services/vscode-data-provider.service";
import { AgGridModule } from 'ag-grid-angular';
import { WebSocketMessagesComponent } from './web-socket-messages/web-socket-messages.component';
import { ComparerComponent } from './comparer/comparer.component';
import { MarketplaceAppComponent } from './marketplace-app/marketplace-app.component';



@NgModule({
	declarations: [
		AppComponent,
		CatalogComponent,
		ConnectionComponent,
		SqlTableComponent,
		FeaturesComponent,
		WebSocketMessagesComponent,
		ComparerComponent,
		MarketplaceAppComponent
	],
	imports: [BrowserModule, AppRoutingModule, FormsModule, ReactiveFormsModule, AgGridModule, DragDropModule],
	providers: [VscodeDataProviderService],
	bootstrap: [AppComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
