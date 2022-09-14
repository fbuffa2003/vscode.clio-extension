import { CallTracker, rejects } from "assert";
import { resolve } from "path";
import { stringify } from "querystring";
import * as vscode from "vscode";
import { ClioExecutor } from "../Common/clioExecutor";
import { getNonce } from "./getNonce";

export class InstallMarketplaceApp 
{
	public static currentPanel: InstallMarketplaceApp | undefined;
	public static readonly viewType = "InstallMarketplaceApp";
	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri) 
	{
		const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
		
		// If we already have a panel, show it.
		if (InstallMarketplaceApp.currentPanel) 
		{
			InstallMarketplaceApp.currentPanel._panel.reveal(column);
			InstallMarketplaceApp.currentPanel._update();
			return;
		}

		const options :vscode.WebviewOptions = {
			enableScripts : true,
			localResourceRoots: [
				vscode.Uri.joinPath(extensionUri, "media")
			],
			
		};

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			InstallMarketplaceApp.viewType, 
			"Install Marketplace App",
			column || vscode.ViewColumn.One,
			options
		);
		panel.title = "Install Marketplace App";

		panel.iconPath = {
			light: vscode.Uri.joinPath(extensionUri, 'resources', 'icon', 'creatio-circle-white.svg'),
			dark: vscode.Uri.joinPath(extensionUri, 'resources', 'icon', 'creatio-circle-white.svg')
		};
		InstallMarketplaceApp.currentPanel = new InstallMarketplaceApp(panel, extensionUri);
	}

	public static kill() {
		InstallMarketplaceApp.currentPanel?.dispose();
		InstallMarketplaceApp.currentPanel = undefined;
	}

	public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		InstallMarketplaceApp.currentPanel = new InstallMarketplaceApp(panel, extensionUri);
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
						//vscode.commands.executeCommand("ClioSQL.RegisterWebApp", data);
						vscode.window.showInformationMessage(`An app with id ${data} will be installed`);
						return;
				}
			},
			null,
			this._disposables
		);
	}

	public dispose() {
		InstallMarketplaceApp.currentPanel = undefined;

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
		this._panel.webview.html = await this._getHtmlForWebview(webview);
	}

	private async _getHtmlForWebview(webview: vscode.Webview) 
	{
		// Local path to main script run in the webview
		const scriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'media','handleSubmit.js');
		
		// And the uri we use to load this script in the webview
		const scriptUri = webview.asWebviewUri(scriptPathOnDisk);
		
		// // Use a nonce to only allow specific scripts to be run
		const nonce = getNonce();
		
		let x: String;
		let clio = new ClioExecutor();
		const catalog = await clio.ExecuteClioCommand('clio catalog');

		const html = this.buildRow(catalog);
		return `<!DOCTYPE html>
				<html lang="en">
					<head>
						<meta charset="UTF-8">
						<!--
							Use a content security policy to only allow loading images from https or from our extension directory,
							and only allow scripts that have a specific nonce.
						-->
						<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
						<meta name="viewport" content="width=device-width, initial-scale=1.0">
					</head>
					<body>
						<h1>Marketplace applications</h1>
						<table>
							<thead>
								<tr>
									<th>App Id</th>
									<th>App Name</th>
								</tr>
							</thead>
							<tbody>
								${html}
							</tbody>
						</table>
						<script nonce="${nonce}" src="${scriptUri}"></script>
					</body>
				</html>`;
	}


	private buildRow(data: String) : String {
		const lines: String[] = data.split("\r\n");
		let html = '';
		lines.forEach(line=>{
			const m = line.match(/\d{4,6}/);
			if(m){
				let id = Number.parseInt(m[0]);
				let name = line.substring(m[0].length, line.length-m[0].length).trim();
				html +=
					`<tr>
					<td>${id}</td>
					<td>${name}</td>
					<td><input type='button' id="${id}" value='Will Install in the future (not implemented)'/></td>
					</tr>`;
			}
		});
		return html;
	}


	private _deserializeData(obj: any): MarketplaceApps{
		const a : MarketplaceApps = obj;
		return obj;
	}
}
export interface MarketplaceApps{
	Apps: Array<MarketplaceApp>;
}

export interface MarketplaceApp{
	id: number;
	name: string;
}
