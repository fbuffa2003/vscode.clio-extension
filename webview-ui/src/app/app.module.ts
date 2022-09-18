import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { AppComponent } from "./app.component";
import { MarketplacecatalogModule } from "./marketplacecatalog/marketplacecatalog.module";

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, MarketplacecatalogModule],
  providers: [],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
