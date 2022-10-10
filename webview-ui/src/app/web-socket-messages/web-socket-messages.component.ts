import { Component, HostListener, OnInit } from "@angular/core";
import { Checkbox, provideVSCodeDesignSystem, vsCodeButton, vsCodeCheckbox, vsCodeDataGrid, vsCodeDataGridCell, vsCodeDataGridRow, vsCodeProgressRing, vsCodeTextField } from '@vscode/webview-ui-toolkit';

@Component({
	selector: "app-web-socket-messages",
	templateUrl: "./web-socket-messages.component.html",
	styleUrls: ["./web-socket-messages.component.css"],
})
export class WebSocketMessagesComponent implements OnInit {
	
	private _imageUri;
	public environmentName;
	public circleImageUri;

	mainTableCss:string = "main-table";
	
	private _searchValue : string = '';
	public get SearchValue() : string {
		return this._searchValue;
	}
	public set SearchValue(v : string) {
		this._searchValue = v;
	}

	private _messages : Array<IWebSocketMessage> = [];
	public get Messages() : Array<IWebSocketMessage> {
		return this._messages;
	}
	private set Messages(v : Array<IWebSocketMessage>) {
		this._messages = v;
	}

	private _loadingMaskVisible : boolean = false;
	public get LoadingMaskVisible() : boolean {
		return this._loadingMaskVisible;
	}
	private set LoadingMaskVisible(v : boolean) {
		this._loadingMaskVisible = v;
		if(v){
			this.mainTableCss = "main-table loading";
		}else{
			this.mainTableCss = "main-table";
		}
	}

	public get Data() : Array<IWebSocketMessage> {
		if(this.SearchValue.length > 0) {
			return this.Messages.filter(m => m.Header.Sender.toLowerCase().includes(this.SearchValue.toLowerCase()));
		}
		else{
			return this.Messages;
		}
	}

	constructor() {
		provideVSCodeDesignSystem().register(
			vsCodeButton(),vsCodeCheckbox(),vsCodeTextField(), vsCodeProgressRing(),
			vsCodeDataGrid(), vsCodeDataGridRow(), vsCodeDataGridCell()
		);
		this._imageUri = history.state.imageUri;
		this.environmentName = history.state.environmentName;
		this.circleImageUri = this._imageUri+'/'+"creatio-square.svg";
	}
	

	@HostListener("window:message", ["$event"])
	onMessage(ev: any) {

		const msg = (ev.data as IWebSocketMessage);
		msg.BodyTxt = JSON.stringify(msg.Body);
		//this.Messages.push(msg);
		this.Messages.unshift(msg);
	}

	
	ngOnInit(): void {}
}


export interface IWebSocketMessage{
	Id: string,
	Header:{
		Sender: string
		BodyTypeName: string|undefined
	},
	Body: object|undefined
	BodyTxt: string|undefined
}