import * as vscode from 'vscode';
import * as fs from 'fs';
import path = require('path');

export class Package extends vscode.TreeItem{
	
	constructor(
		public readonly label: string,
		private readonly folderUri: vscode.Uri
	  ) {
		super(label, vscode.TreeItemCollapsibleState.None);
		this.tooltip = new vscode.MarkdownString("This is an assembly package, read more on the [academy](https://academy.creatio.com/docs/developer/development_tools/packages/assembly_package/overview)");
		
		this.getDescription();
		this.contextValue = "clio.Package";
	  }
	iconPath = new vscode.ThemeIcon("package");

	private getDescription(): void{
		const descriptorFilePath = path.join(this.folderUri.fsPath, "packages",this.label,"descriptor.json");
		if(!fs.existsSync(descriptorFilePath)){return;}

		try {
			const jsonFileContent = fs.readFileSync(descriptorFilePath);
			var json = jsonFileContent.toString('utf8');
			//https://github.com/nodejs/node-v0.x-archive/issues/4039#issuecomment-8828783
			if (json.charAt(0) === '\uFEFF'){
				json = json.substr(1);
			} 

			const model = JSON.parse(json);
			const description = model['Descriptor']['Description'];
			this.description = description ?? "";

		} catch (error) {
			console.error(error);
		}
	}
}