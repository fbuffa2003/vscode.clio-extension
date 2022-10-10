import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CatalogComponent } from './catalog/catalog.component';
import { ConnectionComponent } from './connection/connection.component';
import { SqlTableComponent } from './sql-table/sql-table.component';
import { FeaturesComponent } from './features/features.component';
import { VscodeDataProviderService } from "./services/vscode-data-provider.service";
import { AgGridModule } from 'ag-grid-angular';
import { WebSocketMessagesComponent } from './web-socket-messages/web-socket-messages.component';


@NgModule({
  declarations: [
    AppComponent,
    CatalogComponent,
    ConnectionComponent,
    SqlTableComponent,
    FeaturesComponent,
    WebSocketMessagesComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
	FormsModule, 
	ReactiveFormsModule,
	AgGridModule
  ],
  providers: [VscodeDataProviderService],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule { }
