"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MarketplacecatalogModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplacecatalogModule = void 0;
const core_1 = require("@angular/core");
const platform_browser_1 = require("@angular/platform-browser");
const listing_component_1 = require("./listing/listing.component");
const common_1 = require("@angular/common");
let MarketplacecatalogModule = MarketplacecatalogModule_1 = class MarketplacecatalogModule {
};
MarketplacecatalogModule = MarketplacecatalogModule_1 = __decorate([
    (0, core_1.NgModule)({
        declarations: [listing_component_1.ListingComponent],
        imports: [common_1.CommonModule, platform_browser_1.BrowserModule],
        providers: [],
        bootstrap: [MarketplacecatalogModule_1],
        schemas: [core_1.CUSTOM_ELEMENTS_SCHEMA],
        exports: [listing_component_1.ListingComponent],
    })
], MarketplacecatalogModule);
exports.MarketplacecatalogModule = MarketplacecatalogModule;
//# sourceMappingURL=marketplacecatalog.module.js.map