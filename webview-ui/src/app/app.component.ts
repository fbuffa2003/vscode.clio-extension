import { Component, ElementRef } from '@angular/core';
import { Router } from '@angular/router';

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
		//this._router.navigate([this.pageName, this.environmentName]);

		this._router.navigate([this.pageName], {
			state:{
				imageUri:this.imagesUri,
				environmentName : this.environmentName
			}
		});
	}	
}
