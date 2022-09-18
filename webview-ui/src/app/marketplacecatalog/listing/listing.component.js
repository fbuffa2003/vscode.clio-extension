"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListingComponent = void 0;
const core_1 = require("@angular/core");
const webview_ui_toolkit_1 = require("@vscode/webview-ui-toolkit");
const vscode_1 = require("./../../utilities/vscode");
// In order to use the Webview UI Toolkit web components they
// must be registered with the browser (i.e. webview) using the
// syntax below.
(0, webview_ui_toolkit_1.provideVSCodeDesignSystem)().register((0, webview_ui_toolkit_1.vsCodeButton)(), (0, webview_ui_toolkit_1.vsCodeCheckbox)(), (0, webview_ui_toolkit_1.vsCodeDataGrid)(), (0, webview_ui_toolkit_1.vsCodeDataGridRow)(), (0, webview_ui_toolkit_1.vsCodeDataGridCell)());
// To register more toolkit components, simply import the component
// registration function and call it from within the register
// function, like so:
//
// provideVSCodeDesignSystem().register(
//   vsCodeButton(),
//   vsCodeCheckbox()
// );
//
// Finally, if you would like to register all of the toolkit
// components at once, there's a handy convenience function:
//
// provideVSCodeDesignSystem().register(allComponents.register());
let ListingComponent = class ListingComponent {
    constructor() { }
    ngOnInit() {
        console.log(this.variableA);
    }
    handleHowdyClick() {
        alert("test");
        vscode_1.vscode.postMessage({
            command: "hello",
            text: "Hey there partner! 🤠",
        });
    }
};
__decorate([
    (0, core_1.Input)()
], ListingComponent.prototype, "variableA", void 0);
ListingComponent = __decorate([
    (0, core_1.Component)({
        selector: 'app-listing',
        templateUrl: './listing.component.html',
        styleUrls: ['./listing.component.css']
    })
], ListingComponent);
exports.ListingComponent = ListingComponent;
//# sourceMappingURL=listing.component.js.map