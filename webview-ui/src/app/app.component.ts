import { Component, ElementRef } from '@angular/core';
import { provideVSCodeDesignSystem, vsCodeButton, vsCodeCheckbox, vsCodeDataGrid, vsCodeDataGridCell, vsCodeDataGridRow } from "@vscode/webview-ui-toolkit";
import { Router } from '@angular/router';

provideVSCodeDesignSystem().register(
	vsCodeButton(), vsCodeCheckbox(), 
	vsCodeDataGrid(), vsCodeDataGridRow(), vsCodeDataGridCell()
);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'webview-ui';

  environmentName: string | undefined;
  pageName: string;
  imagesUri: string;

	circleImage: string;

	constructor(private elementRef:ElementRef, private _router:Router) {
		this.environmentName = this.elementRef.nativeElement.getAttribute('environmentName');
		this.pageName = this.elementRef.nativeElement.getAttribute('pageName');
		this.imagesUri = this.elementRef.nativeElement.getAttribute('imagesUri');
		
		console.log(this.imagesUri);

		this.circleImage = this.imagesUri+'/'+"creatio-circle.svg";
		console.log(this.circleImage);

		this._router.navigate(['catalog', this.environmentName]);

	}	

}
