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
	
	private _logMessages : Array<ILogPortionItem> = [];
	public get LogMessages() : Array<ILogPortionItem> {
		return this._logMessages;
	}
	private set LogMessages(v : Array<ILogPortionItem>) {
		this._logMessages = v;
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
		if(msg.Header.Sender === "TelemetryService"){
			const log = msg.Body as ILogMessage;
			if(log && log.logPortion){
				//console.log(log.logPortion[0].message);
				const n = ((msg.Body as any).logPortion[0].date as string).substring(6,24).split('+');
				const item: ILogPortionItem = {
					date: new Date(parseInt(n[0])+parseInt(n[1])),
					level: log.logPortion[0].level,
					logger: log.logPortion[0].logger,
					message: log.logPortion[0].message
				};
				this.LogMessages.unshift(item);
				debugger;
			}
		}else{
			msg.BodyTxt = JSON.stringify(msg.Body);
			this.Messages.unshift(msg);
		}
	}

	ngOnInit(): void {}
}


export interface IWebSocketMessage{
	Id: string,
	Header:{
		Sender: string
		BodyTypeName: string|undefined
	},
	Body: object|undefined|ILogMessage
	BodyTxt: string|undefined

}


export interface ILogMessage{
	cpu: number
	ramMb: number
	logPortion: Array<ILogPortionItem>
}

export interface ILogPortionItem{
	date: Date,
	level: string,
	logger: string,
	message: string,
}