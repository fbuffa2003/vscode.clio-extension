import * as vscode from 'vscode';

export class Application extends vscode.TreeItem{
	constructor(
		public readonly label: string,
		private version: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		
	  ) {
		super(label, collapsibleState);
		this.tooltip = `Application`;
		this.description = this.version;
		this.contextValue = "clio.Application";
	  }
	
	iconPath = new vscode.ThemeIcon("symbol-class");
}