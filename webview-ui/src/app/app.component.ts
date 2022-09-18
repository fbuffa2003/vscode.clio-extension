import { Component, ElementRef, Input } from "@angular/core";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent {
	title = "Clio";

	environmentName: string | undefined;
	pageName: string;

	constructor(private elementRef:ElementRef) {
		this.environmentName = this.elementRef.nativeElement.getAttribute('environmentName');
		this.pageName = this.elementRef.nativeElement.getAttribute('pageName');
	}	
}
