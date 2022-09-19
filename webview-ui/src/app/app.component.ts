import { Component, ElementRef } from '@angular/core';
import { Router } from '@angular/router';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent {
	constructor(private elementRef:ElementRef, private _router:Router) {
		const environmentName = this.elementRef.nativeElement.getAttribute('environmentName');
		const pageName = this.elementRef.nativeElement.getAttribute('pageName');
		const imagesUri = this.elementRef.nativeElement.getAttribute('imagesUri');
	
		this._router.navigate([pageName], {
			state:{
				imageUri:imagesUri,
				environmentName : environmentName
			}
		});
	}
}
