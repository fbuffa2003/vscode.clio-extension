import { Component, Input, OnInit } from '@angular/core';
import { provideVSCodeDesignSystem, vsCodeButton, vsCodeCheckbox, vsCodeDataGrid, vsCodeDataGridCell, vsCodeDataGridRow } from "@vscode/webview-ui-toolkit";
import { vscode } from "./../../utilities/vscode";

// In order to use the Webview UI Toolkit web components they
// must be registered with the browser (i.e. webview) using the
// syntax below.
provideVSCodeDesignSystem().register(
	vsCodeButton(), vsCodeCheckbox(), 
	vsCodeDataGrid(), vsCodeDataGridRow(), vsCodeDataGridCell()
);

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
@Component({
  selector: 'app-listing',
  templateUrl: './listing.component.html',
  styleUrls: ['./listing.component.css']
})
export class ListingComponent implements OnInit {

	@Input()
	variableA: string | undefined;

	constructor() { }

	ngOnInit(): void {
		console.log(this.variableA)
	}

	handleHowdyClick() {
		alert("test");
		vscode.postMessage({
		command: "hello",
		text: "Hey there partner! 🤠",
		});
	}
}
