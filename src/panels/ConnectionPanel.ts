import * as vscode from "vscode";
import { Disposable, Webview, WebviewPanel, window, Uri, ViewColumn } from "vscode";
import { Environment } from "../service/TreeItemProvider/Environment";
import { getUri } from "../utilities/getUri";
import { getNonce } from "./getNonce";

export class ConnectionPanel {
	public static currentPanel: ConnectionPanel | undefined;
	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private readonly _formData: FormData;
	private readonly _isEdit: boolean = false;
	private readonly _node: Environment | undefined;
	private _disposables: Disposable[] = [];
	private static _envName: string | undefined;

	/**
	 * The CatalogPanel class private constructor (called only from the render method).
	 *
	 * @param panel A reference to the webview panel
	 * @param extensionUri The URI of the directory containing the extension
	 */
	private constructor(panel: WebviewPanel, extensionUri: Uri, formData: FormData, isEdit: boolean, node: Environment | undefined) {
		this._panel = panel;
		this._extensionUri = extensionUri;
		this._formData = formData;
		this._isEdit = isEdit;
		this._node = node;

		// Set an event listener to listen for when the panel is disposed (i.e. when the user closes
		// the panel or when the panel is closed programmatically)
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Set the HTML content for the webview panel
		this._panel.webview.html = this._getWebviewContent(this._panel.webview, this._extensionUri, this._formData, this._isEdit);

		// Set an event listener to listen for messages passed from the webview context
		this._setWebviewMessageListener(this._panel.webview);		
	}

	/**
	 * Renders the current webview panel if it exists otherwise a new webview panel
	 * will be created and displayed.
	 *
	 * @param extensionUri The URI of the directory containing the extension.
	 */
	public static render(extensionUri: vscode.Uri, formData: FormData, isEdit: boolean, node: Environment | undefined) {

		if (ConnectionPanel.currentPanel) {
		// If the webview panel already exists reveal it
		ConnectionPanel.currentPanel._panel.reveal(ViewColumn.One);
		} else {

			ConnectionPanel._envName = "";
			const panelTitle = isEdit ? `Edit (${node?.label})` : "New connection";
			
			// If a webview panel does not already exist create and show a new one
			const panel = window.createWebviewPanel(
				// Panel view type
				"showHelloWorld",
				// Panel title
				panelTitle,
				// The editor column the panel should be displayed in
				// Extra panel configurations
				ViewColumn.One,
				{
					// Enable JavaScript in the webview
					enableScripts: true,
				},
				
			);
		
			panel.iconPath = {
				light: vscode.Uri.joinPath(extensionUri, 'resources', 'icon', 'creatio-circle-white.svg'),
				dark: vscode.Uri.joinPath(extensionUri, 'resources', 'icon', 'creatio-circle-white.svg')
			};
			
			ConnectionPanel.currentPanel = new ConnectionPanel(panel, extensionUri, formData, isEdit, node);
		}
	}
	
	public static kill() {
		ConnectionPanel.currentPanel?.dispose();
		ConnectionPanel.currentPanel = undefined;
	}

	/**
	 * Cleans up and disposes of webview resources when the webview panel is closed.
	 */
	public dispose() {
		ConnectionPanel.currentPanel = undefined;

		// Dispose of the current webview panel
		this._panel.dispose();

		// Dispose of all disposables (i.e. commands) for the current webview panel
		while (this._disposables.length) 
		{
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
	private _getWebviewContent(webview: Webview, extensionUri: Uri, formData: FormData, isEdit: boolean) {
		// The CSS file from the Angular build output
		const stylesUri = getUri(webview, extensionUri, ["webview-ui", "build", "styles.css"]);
		// The JS files from the Angular build output
		const runtimeUri = getUri(webview, extensionUri, ["webview-ui", "build", "runtime.js"]);
		const polyfillsUri = getUri(webview, extensionUri, ["webview-ui", "build", "polyfills.js"]);
		const scriptUri = getUri(webview, extensionUri, ["webview-ui", "build", "main.js"]);
		const imagesUri = getUri(webview, extensionUri, ["resources", "icon"]);
		const nonce = getNonce();
	
		//Cannot get it to work
		/*<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}'; font-src 'none';">*/

		// Tip: Install the es6-string-html VS Code extension to enable code highlighting below
		return /*html*/ `
		<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<link rel="stylesheet" type="text/css" href="${stylesUri}">
				
				<title>Add new connection</title>
			</head>
			<body>
				<div class="hidden">
					<i class="codicon codicon-account"></i>
					<img src="${imagesUri}/creatio-square.svg">
					<img src="${imagesUri}/connection.svg">
				</div>
				<app-root environmentName="${ConnectionPanel._envName}" pageName="connection" imagesUri="${imagesUri}" 
					name="${formData.name}" url="${formData.url}" username="${formData.username}" password="${formData.password}" maintainer="${formData.maintainer}"
				 	isNetCore="${formData.isNetCore}" isSafe="${formData.isSafe}" isDeveloperModeEnabled="${formData.isDeveloperModeEnabled}"
					clientId="${formData.clientId}" clientSecret="${formData.clientSecret}" isEdit="${isEdit}"></app-root>
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
				switch (command) {
					case "regWebApp": {
						if ( message.isEdit && this._node) {
							await this._node.unregisterWebApp();
						}
						vscode.commands.executeCommand("ClioSQL.RegisterWebApp", message.data);
						break;
					}
					case "GoOAuth": {
						var url = message.data.url;
						vscode.env.openExternal(vscode.Uri.parse(url));
						break;
					}						
				}
			},
			null,
			this._disposables
		);
	}

	public sendMessage(){
		const msg = {
			"myData":"my data will be here"
		};
		this._panel.webview.postMessage(msg);
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


	clientId: string,

	clientSecret: string

}