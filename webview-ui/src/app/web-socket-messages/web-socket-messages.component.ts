import { Component, HostListener, OnInit } from "@angular/core";
import { provideVSCodeDesignSystem, vsCodeBadge, vsCodeButton, vsCodeCheckbox, vsCodeDataGrid, vsCodeDataGridCell, vsCodeDataGridRow, vsCodeProgressRing, vsCodeTextField } from '@vscode/webview-ui-toolkit';
import { LogLevel, VscodeDataProviderService } from "../services/vscode-data-provider.service";

@Component({
	selector: "app-web-socket-messages",
	templateUrl: "./web-socket-messages.component.html",
	styleUrls: ["./web-socket-messages.component.css"],
})
export class WebSocketMessagesComponent implements OnInit {
	
	private _imageUri;
	private _loadingMaskVisible : boolean = false;
	public environmentName;
	public circleImageUri;
	public loggerName = '';
	public defaultLoggerName = 'ExceptNoisyLoggers';
	public logLevel = '';
	public buttonText: string = 'Start';

	private _isBroadcastStarted :boolean = false;
	public get IsBroadcastStarted() :boolean {
		return this._isBroadcastStarted;
	}
	public set IsBroadcastStarted(v :boolean) {
		if(v){
			this.buttonText = "Stop";
		}else{
			this.buttonText = "Start";
		}

		this._isBroadcastStarted = v;
	}
	
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
	
	private _logMessagesFiltered : Array<ILogPortionItem> = [];
	public get LogMessagesFiltered() : Array<ILogPortionItem> {

		if(this.SearchValue.length >0){
			return this.LogMessages.filter(item=> item.message.includes(this.SearchValue));
		}
		else{
			return this.LogMessages;
		}
	}
	private set LogMessagesFiltered(v : Array<ILogPortionItem>) {
		this._logMessagesFiltered = v;
	}

	private _logMessages : Array<ILogPortionItem> = [];
	public get LogMessages() : Array<ILogPortionItem> {
		return this._logMessages;
	}
	private set LogMessages(v : Array<ILogPortionItem>) {
		this._logMessages = v;
	}

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

	constructor(private readonly vscodeDataProvider: VscodeDataProviderService) {
		provideVSCodeDesignSystem().register(
			vsCodeButton(),vsCodeCheckbox(),vsCodeTextField(), vsCodeProgressRing(),
			vsCodeBadge(),
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
				const n = ((msg.Body as any).logPortion[0].date as string).substring(6,24).split('+');
				const item: ILogPortionItem = {
					date: new Date(parseInt(n[0])+parseInt(n[1])),
					level: log.logPortion[0].level,
					logger: log.logPortion[0].logger,
					message: log.logPortion[0].message
				};
				this.LogMessages.unshift(item);
			}
		}
	}

	ngOnInit(): void {
	}

	toggleBroadcast(){
		if(this.IsBroadcastStarted){
			this.vscodeDataProvider.stopLogBroadcast(this.environmentName);
			this.IsBroadcastStarted = !this.IsBroadcastStarted;
			
		}else{
			this.vscodeDataProvider.startLogBroadcast(this.environmentName, LogLevel.ALL, this.loggerName.length>0 ? this.loggerName : this.defaultLoggerName);
			this.IsBroadcastStarted = !this.IsBroadcastStarted;
		}
	}

	clearLogger(){
		this.loggerName ="";
	}
	clearGrid(){
		this.LogMessages = [];
	}
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