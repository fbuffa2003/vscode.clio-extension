import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { ListingComponent } from './listing/listing.component';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [ ListingComponent ],
  imports: [CommonModule, BrowserModule],
  providers: [],
  bootstrap: [MarketplacecatalogModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  exports:[	ListingComponent ],
})
export class MarketplacecatalogModule { }
