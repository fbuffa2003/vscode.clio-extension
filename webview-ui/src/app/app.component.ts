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
		const name = this.elementRef.nativeElement.getAttribute('name');
		const url = this.elementRef.nativeElement.getAttribute('url');
		const username = this.elementRef.nativeElement.getAttribute('username');
		const password = this.elementRef.nativeElement.getAttribute('password');
		const maintainer = this.elementRef.nativeElement.getAttribute('maintainer');
		const isNetCore = this.elementRef.nativeElement.getAttribute('isNetCore')?.toLowerCase() === 'true';
		const isSafe = this.elementRef.nativeElement.getAttribute('isSafe')?.toLowerCase() === 'true';
		const isDeveloperModeEnabled = this.elementRef.nativeElement.getAttribute('isDeveloperModeEnabled')?.toLowerCase() === 'true';
		const clientId = this.elementRef.nativeElement.getAttribute('clientId');
		const clientSecret = this.elementRef.nativeElement.getAttribute('clientSecret');
		const isEdit = this.elementRef.nativeElement.getAttribute('isEdit')?.toLowerCase() === 'true';

		switch(pageName) {
			case "connection": {
				this._router.navigate([pageName], {
					state: {
						imageUri: imagesUri,
						environmentName: environmentName,
						name: name,
						url: url,
						username: username,
						password: password,
						maintainer: maintainer,
						isNetCore: isNetCore,
						isSafe: isSafe,
						isDeveloperModeEnabled: isDeveloperModeEnabled,			
						clientId: clientId,			
						clientSecret: clientSecret,
						isEdit: isEdit
					}
				});		
				break;
			}				
			default: {
				this._router.navigate([pageName], {
					state: {
						imageUri: imagesUri,
						environmentName: environmentName
					}
				});		
				break;
			}			
		}

	}
}
