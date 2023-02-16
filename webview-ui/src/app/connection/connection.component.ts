import { Component, OnInit } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, NgForm, Validators } from "@angular/forms";
import { provideVSCodeDesignSystem, vsCodeButton, vsCodeCheckbox, vsCodeLink, vsCodeTextField } from "@vscode/webview-ui-toolkit";
import { vscode } from "../utilities/vscode";


@Component({
	selector: "app-connection",
	templateUrl: "./connection.component.html",
	styleUrls: ["./connection.component.css"],
})
export class ConnectionComponent implements OnInit {
	
	private imageUri;
	public circleImageUri;
	public formData : any;
	public data = {
		connectionName: "",
		userName: "",
		password: "",
		url: "",
		maintainer: "Customer",
		isNetCore: false,
		isSafe: false,
		isDeveloperMode: false,
		clientId: "",
		clientSecret: ""
	};

	constructor() {
		provideVSCodeDesignSystem().register(
			vsCodeButton(), vsCodeTextField(), vsCodeCheckbox(),vsCodeLink()
			);
		this.imageUri = history.state.imageUri;
		//this.circleImageUri = this.imageUri+'/'+"creatio-square.svg";
		this.circleImageUri = this.imageUri+'/'+"Add.svg";
	}

	ngOnInit(): void {}

	onSubmit(form: NgForm){
		if(form.valid){
			vscode.postMessage(
			{
				command: 'regWebApp',
				data:{
					name: this.data.connectionName,
					url: this.data.url,
					username: this.data.userName,
					password: this.data.password,
					maintainer: this.data.maintainer,
					isNetCore: this.data.isNetCore,
					isSafe: this.data.isSafe,
					isDeveloperModeEnabled: this.data.isDeveloperMode,
					clientId : this.data.clientId,
					clientSecret : this.data.clientSecret
				}
			});
		} else{
			// alert('Form is invalid, you are an idiot');
			console.log('Form is invalid');
		}

	}

	onGoOAuth(form: NgForm){
		//if (this.getCorrectOAuthUri(this.data.url)) {
			vscode.postMessage(
			{
				command: 'GoOAuth',
				data:{
					//url: this.data.url
					url: this.getCorrectOAuthUri(this.data.url)
				}
			});
		//}
	}

	getCorrectOAuthUri(ur: string){
		if (ur.search("http://")<0 && ur.search("https://")<0){
			ur = "http://" + ur;
		}
		let rr = ur.search("/0/");
		if (rr > -1){
			ur = ur.substring(0, rr);
		}
		ur = ur + "/0/shell/?autoOpenIdLogin=true#SectionModuleV2/OAuthClientAppSection";
		//return true;
		return ur;
	}

}
