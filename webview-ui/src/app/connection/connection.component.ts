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
		maintainer: "",
		isNetCore: false,
		isSafe: false,
		isDeveloperMode: false
	};

	constructor() {
		provideVSCodeDesignSystem().register(
			vsCodeButton(), vsCodeTextField(), vsCodeCheckbox(),vsCodeLink()
			);
		this.imageUri = history.state.imageUri;
		this.circleImageUri = this.imageUri+'/'+"creatio-square.svg";
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
					isDeveloperModeEnabled: this.data.isDeveloperMode
				}
			});
		} else{
			// alert('Form is invalid, you are an idiot');
			console.log('Form is invalid');
		}

	}
}
