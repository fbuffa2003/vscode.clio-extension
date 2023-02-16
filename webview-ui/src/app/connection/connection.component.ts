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
		connectionName: history.state.name,
		url: history.state.url,
		userName: history.state.username,
		password: history.state.password,
		maintainer: history.state.maintainer,
		isNetCore: history.state.isNetCore,
		isSafe: history.state.isSafe,
		isDeveloperMode: history.state.isDeveloperModeEnabled,
		clientId: history.state.clientId,
		clientSecret: history.state.clientSecret
	};

	constructor() {
		provideVSCodeDesignSystem().register(
			vsCodeButton(), vsCodeTextField(), vsCodeCheckbox(),vsCodeLink()
			);
		this.imageUri = history.state.imageUri;
		this.circleImageUri = this.imageUri+'/'+"connection.svg";		
		this.data.connectionName = history.state.name;
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
				},
				isEdit: history.state.isEdit,
			});
		} else{
			console.log('Form is invalid');
		}

	}

	onGoOAuth(form: NgForm){
		if (this.data.url.length === 0) {
			return;
		}
			vscode.postMessage(
			{
				command: 'GoOAuth',
				data:{
					url: this.getCorrectOAuthUri(this.data.url)
				}
			});
	}

	getCorrectOAuthUri(url: string){
		if (url.search("http://") < 0 && url.search("https://") < 0){
			url = "https://" + url;
		}
		let workplacePosition = url.search("/0/");
		if (workplacePosition > -1) {
			url = url.substring(0, workplacePosition);
		}
		url = url + "/0/shell/?autoOpenIdLogin=true#SectionModuleV2/OAuthClientAppSection";
		return url;
	}

}
