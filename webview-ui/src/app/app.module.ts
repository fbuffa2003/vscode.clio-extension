import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CatalogComponent } from './catalog/catalog.component';
import { ConnectionComponent } from './connection/connection.component';
import { SqlTableComponent } from './sql-table/sql-table.component';



@NgModule({
  declarations: [
    AppComponent,
    CatalogComponent,
    ConnectionComponent,
    SqlTableComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
	FormsModule, ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule { }
