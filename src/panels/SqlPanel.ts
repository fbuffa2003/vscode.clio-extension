import * as vscode from "vscode";
import { Disposable, Webview, WebviewPanel, window, Uri, ViewColumn } from "vscode";
import { ClioExecutor } from "../Common/clioExecutor";
import { Environment } from "../service/TreeItemProvider/Environment";
import { getUri } from "../utilities/getUri";

export class SqlPanel {
	public static currentPanel: SqlPanel | undefined;
	private readonly _panel: WebviewPanel;
	private _disposables: Disposable[] = [];
	private static _envName : string | undefined;
	private _clio: ClioExecutor;

	/**
	 * The CatalogPanel class private constructor (called only from the render method).
	 *
	 * @param panel A reference to the webview panel
	 * @param extensionUri The URI of the directory containing the extension
	 */
	private constructor(panel: WebviewPanel, extensionUri: Uri) {
		this._panel = panel;
		this._clio = new ClioExecutor();

		// Set an event listener to listen for when the panel is disposed (i.e. when the user closes
		// the panel or when the panel is closed programmatically)
		this._panel.onDidDispose(this.dispose, null, this._disposables);

		// Set the HTML content for the webview panel
		this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);

		// Set an event listener to listen for messages passed from the webview context
		this._setWebviewMessageListener(this._panel.webview);

		
	}

	/**
	 * Renders the current webview panel if it exists otherwise a new webview panel
	 * will be created and displayed.
	 *
	 * @param extensionUri The URI of the directory containing the extension.
	 */
	public static render(extensionUri: Uri, envName: string) {

		if (SqlPanel.currentPanel) {
			// If the webview panel already exists reveal it
			SqlPanel.currentPanel._panel.reveal(ViewColumn.Two);
		} else {

			SqlPanel._envName = envName;
			
			// If a webview panel does not already exist create and show a new one
			const panel = window.createWebviewPanel(
				// Panel view type
				"showSqlPanel",
				// Panel title
				"CLIO SQL",
				// The editor column the panel should be displayed in
				ViewColumn.Two,
				// Extra panel configurations
				{
					// Enable JavaScript in the webview
					enableScripts: true
				},
				
			);
		
			panel.iconPath = {
				light: vscode.Uri.joinPath(extensionUri, 'resources', 'icon', 'schema-sql.svg'),
				dark: vscode.Uri.joinPath(extensionUri, 'resources', 'icon', 'schema-sql.svg')
			};
			
			SqlPanel.currentPanel = new SqlPanel(panel, extensionUri);
		}
	}

	/**
	 * Cleans up and disposes of webview resources when the webview panel is closed.
	 */
	public dispose() {
		SqlPanel.currentPanel = undefined;

		// Dispose of the current webview panel
		this._panel.dispose();

		// Dispose of all disposables (i.e. commands) for the current webview panel
		while (this._disposables.length) {
		const disposable = this._disposables.pop();
		if (disposable) {
			disposable.dispose();
		}
		}
	}

	/**
	 * Defines and returns the HTML that should be rendered within the webview panel.
	 *
	 * @remarks This is also the place where references to the Angular webview build files
	 * are created and inserted into the webview HTML.
	 *
	 * @param webview A reference to the extension webview
	 * @param extensionUri The URI of the directory containing the extension
	 * @returns A template string literal containing the HTML that should be
	 * rendered within the webview panel
	 */
	private _getWebviewContent(webview: Webview, extensionUri: Uri) {
		// The CSS file from the Angular build output
		const stylesUri = getUri(webview, extensionUri, ["webview-ui", "build", "styles.css"]);
		// The JS files from the Angular build output
		const runtimeUri = getUri(webview, extensionUri, ["webview-ui", "build", "runtime.js"]);
		const polyfillsUri = getUri(webview, extensionUri, ["webview-ui", "build", "polyfills.js"]);
		const scriptUri = getUri(webview, extensionUri, ["webview-ui", "build", "main.js"]);
		
		const imagesUri = getUri(webview, extensionUri, ["resources", "icon"]);
		//https://microsoft.github.io/vscode-codicons/dist/codicon.html
		const codiconsUri = getUri(webview, extensionUri, ["node_modules","@vscode/codicons", "dist","codicon.css"]);

		// Tip: Install the es6-string-html VS Code extension to enable code highlighting below
		return /*html*/ `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8" />
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			<link rel="stylesheet" type="text/css" href="${stylesUri}">
			<title>Clio SQL</title>
		</head>
			<body>
				<div class="hidden">
				<i class="codicon codicon-account"></i>
				<img src="${imagesUri}/creatio-square.svg">
			</div>
				<app-root environmentName="${SqlPanel._envName}" pageName="sql-table" imagesUri="${imagesUri}"></app-root>
				<script type="module" src="${runtimeUri}"></script>
				<script type="module" src="${polyfillsUri}"></script>
				<script type="module" src="${scriptUri}"></script>
			</body>
		</html>
		`;
	}

	/**
	 * Sets up an event listener to listen for messages passed from the webview context and
	 * executes code based on the message that is received.
	 *
	 * @param webview A reference to the extension webview
	 * @param context A reference to the extension context
	 */
	private _setWebviewMessageListener(webview: Webview) {
		webview.onDidReceiveMessage(
		async (message: any) => {
			const command = message.command;
			const environmentName = message.environmentName;

			switch (command) {
				case "getCatalog":{
					// Code that should run in response to the hello message command
					vscode.window.withProgress(
						{
							location : vscode.ProgressLocation.Notification,
							title: "Getting Data"
						},
						async(progress, token)=>{
							const result = await this._clio.ExecuteClioCommand('clio catalog');
							const msg = {
								"getCatalog": result
							};
			
							//raising event, angular subscribes to it
							this._panel.webview.postMessage(msg);
							progress.report({ 
								increment: 100, 
								message: "Done" 
							});
						}
					);
					break;
				}
				case "install":{
					console.log(command);
					const appId = message.appId;
				
					vscode.window.withProgress(
						{
							location : vscode.ProgressLocation.Notification,
							title: `Installing app with id ${appId}`
						},
						async(progress, token)=>{
							const clioExecutor = new ClioExecutor();
							clioExecutor.executeCommandByTerminal(`install --id ${appId} -e ${environmentName}`);
							//const result = await this._clio.ExecuteClioCommand(`clio install --id ${appId} -e ${environmentName}`);
							progress.report({ 
								increment: 100,
								message: "Done"
							});
							//vscode.window.showInformationMessage(result as string);
						}
					);
				}
			}
		},
		undefined,
		this._disposables
		);
	}

	public sendMessage(jsonData: any){
		this._panel.webview.postMessage(JSON.parse(jsonData));
	}
}
