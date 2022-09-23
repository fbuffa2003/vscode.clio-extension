import path = require('path');
import * as vscode from 'vscode';
import { IDownloadPackageArgs, IDownloadPackageResponse } from '../../commands/DownloadPackageCommand';
import { IGetPackagesArgs } from '../../commands/GetPackagesCommand';
import { CreatioTreeItem } from "./CreatioTreeItem";
import { Environment } from './Environment';
import { ItemType } from "./ItemType";

export class PackageList extends CreatioTreeItem {
	readonly itemColor: vscode.ThemeColor = new vscode.ThemeColor("creatio.orangePrimary");
	public contextValue = 'CreatioPackageList';
	constructor(parent: CreatioTreeItem ) {
		super("Packages", "", ItemType.packageList, parent,vscode.TreeItemCollapsibleState.Collapsed);
		this.iconPath = new vscode.ThemeIcon("folder", this.itemColor);
	}

	/**
	 * This method is called from extension.ts in onDidExpandElement event handler
	 */
	public async getPackages(): Promise<void>{
		const args : IGetPackagesArgs = {
			environmentName :  this.parent?.label as string
		};

		if(this.clio.getPackages.canExecute(args).success){
			const pkgs = await this.clio.getPackages.executeAsync(args);

			pkgs.data.forEach(pkg => {
				this.items.push(
					new Package(pkg.name, pkg.version, pkg.maintainer, this)
				);
			});
		}
	}
}

export class Package extends CreatioTreeItem {
	public contextValue = 'CreatioPackage';
	public readonly name : string;
	public readonly version : string;
	public readonly maintainer: string;
	readonly itemColor: vscode.ThemeColor = new vscode.ThemeColor("creatio.orangeSecondary");
	constructor(
		name: string, version: string, maintainer: string, 
		parent: CreatioTreeItem) {
		super(name, version, ItemType.packageItem, parent, vscode.TreeItemCollapsibleState.None);
		this.name = name;
		this.version = version;
		this.maintainer  = maintainer;
		this.tooltip = this.maintainer;
		this.iconPath = new vscode.ThemeIcon("folder", this.itemColor);
	}

	public download(){
		const envName = this.parent?.parent?.label;

		const options: vscode.OpenDialogOptions = {
			canSelectFiles :false,
			canSelectFolders: true,
			canSelectMany: false,
			openLabel: 'Select destination folder'
		};
		vscode.window.showOpenDialog(options).then(async(folderUri) => {
			if (folderUri && folderUri[0]) {
				var folderPath = folderUri[0].fsPath;


				const args : IDownloadPackageArgs = {
					environmentName : envName as String,
					packageName : this.name,
					destinationPath : path.join(folderPath, `${this.name}.gz`)
				};

				const isValid = this.clio.downloadPackage.canExecute(args);
				if(isValid.success){
					vscode.window.withProgress(
						{
						location : vscode.ProgressLocation.Notification,
						title: `Downloading package ${this.name}`
						},
						async(progress, token)=>{
							const result = await this.clio.downloadPackage.executeAsync(args);
							progress.report({ 
								increment: 100,
								message: "Done"
							});
							if(result && result.success){
								vscode.commands.executeCommand("revealFileInOS", folderUri[0].path);
							}else{
								vscode.window.showErrorMessage(result.message as string);
							}
						}
					);
				}else{
					vscode.window.showErrorMessage(isValid.message as string);
				}
			}
		});
	}
}
