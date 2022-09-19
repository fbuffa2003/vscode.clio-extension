import * as vscode from "vscode";
import { getNonce } from "./getNonce";

export class AddConnection 
{
	public static currentPanel: AddConnection | undefined;
	public static readonly viewType = "AddConnection";
	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri) 
	{
		const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
		
		// If we already have a panel, show it.
		if (AddConnection.currentPanel) 
		{
			AddConnection.currentPanel._panel.reveal(column);
			AddConnection.currentPanel._update();
			return;
		}

		const options :vscode.WebviewOptions = {
			enableScripts : true
		};

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			AddConnection.viewType, 
			"Add new connection",
			column || vscode.ViewColumn.One,
			options
		);
		panel.title = "Add new Connection";

		panel.iconPath = {
			light: vscode.Uri.joinPath(extensionUri, 'resources', 'icon', 'creatio-circle-white.svg'),
			dark: vscode.Uri.joinPath(extensionUri, 'resources', 'icon', 'creatio-circle-white.svg')
		};
		AddConnection.currentPanel = new AddConnection(panel, extensionUri);
	}

	public static kill() {
		AddConnection.currentPanel?.dispose();
		AddConnection.currentPanel = undefined;
	}

	public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		AddConnection.currentPanel = new AddConnection(panel, extensionUri);
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage((message) => {
				switch (message.command) {
					case "submit":
						const data = this._deserializeData(message.data);
						vscode.commands.executeCommand("ClioSQL.RegisterWebApp", data);
						return;
				}
			},
			null,
			this._disposables
		);
	}

	public dispose() {
		AddConnection.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();
		while (this._disposables.length) 
		{
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private async _update() 
	{
		const webview = this._panel.webview;
		this._panel.webview.html = this._getHtmlForWebview(webview);
	}

	private _getHtmlForWebview(webview: vscode.Webview) 
	{
		// Local path to main script run in the webview
		const scriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'media','handleSubmit.js');
		
		// And the uri we use to load this script in the webview
		const scriptUri = webview.asWebviewUri(scriptPathOnDisk);
		
		
		//const cssPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'media','css.css');
				
		// And the uri we use to load this script in the webview
		//const cssUri = webview.asWebviewUri(cssPathOnDisk);

		const stylesPathMainPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'css.css');
		const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);


		// // Use a nonce to only allow specific scripts to be run
		const nonce = getNonce();
		
		return /*html*/`
		<!DOCTYPE html>
				<html lang="en">
					<head>
						<meta charset="UTF-8">
						<!--
							Use a content security policy to only allow loading images from https or from our extension directory,
							and only allow scripts that have a specific nonce.
						-->
						<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
						<meta name="viewport" content="width=device-width, initial-scale=1.0">
						<link href="${stylesMainUri}" rel="stylesheet">
					</head>
					
					<body>
						<form id='add-new-connection' class='add-new-connection'>
							<label for="cname">Connection name:</label><br>
							<input type="text" id="cname" name="cname" size="40" placeholder="MyConnection"><br><br>

							<label for="url">Creatio Url:</label><br>
							<input type="text" id="url" name="url" size="40" placeholder="https://myInstance.creatio.com"><br><br>
							
							<label for="username">Username:</label><br>
							<input type="text" id="username" name="username" size="40" placeholder="Supervisor"><br><br>
							
							<label for="password">Password:</label><br>
							<input type="password" id="password" name="password" size="40" placeholder="Supervisor"><br><br>
							
							<label for="maintainer">Maintainer:</label><br>
							<input type="text" id="maintainer" name="maintainer" size="40" placeholder="Customer"><br><br>
							<div id="CheckBoxes">
							<label for="isNetCore">Is NetCore</label>
							<input type="checkbox" id="isNetCore" name="isNetCore" value="isNetCore">

							<label for="isSafe">Is Safe</label>
							<input type="checkbox" id="isSafe" name="isSafe" value="isSafe">

							<label for="isDeveloperModeEnabled">Is Developer Mode Enabled</label>
							<input type="checkbox" id="isDeveloperModeEnabled" name="isDeveloperModeEnabled" value="isDeveloperModeEnabled"><br><br><br>
							</div>
							<input id="MainButton" type="submit" value="Save">
						</form>
						<script nonce="${nonce}" src="${scriptUri}"></script>
					</body>
				</html>`;

		
		
	}

	private _deserializeData(obj: any): FormData{
		const a : FormData = obj;
		return obj;
	}
}

/**
 * Data Model
 */
export interface FormData{

	/**
	 * Connection Name
	 */
	name: string;

	/**
	 * Connection url
	 */
	url : string;

	/**
	 * Username for the connection
	 */
	username: string;

	/**
	 * Password for the connection
	 */
	password: string;

	/**
	 * Maintainer for the connection
	 */
	maintainer: string;

	/**
	 * Indicates that connection to a NetCore Creatio instance
	 */
	isNetCore: boolean;

	/**
	 * Will ask for confirmation for every command
	 */
	isSafe: boolean;

	/**
	 * Will unlock packages
	 */
	isDeveloperModeEnabled: boolean;
}