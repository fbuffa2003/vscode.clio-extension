import * as vscode from 'vscode';
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


		// this.items.push(new Package("Package One", this));
		// this.items.push(new Package("Package Two", this));
		// this.items.push(new Package("Package Three", this));
		// this.items.push(new Package("Package Four", this));
	}

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
	public readonly version : string;
	public readonly maintainer: string;
	readonly itemColor: vscode.ThemeColor = new vscode.ThemeColor("creatio.orangeSecondary");
	constructor(
		name: string, version: string, maintainer: string, 
		parent: CreatioTreeItem) {
		super(name, version, ItemType.packageItem, parent, vscode.TreeItemCollapsibleState.None);
		this.version = version;
		this.maintainer  = maintainer;
		this.tooltip = this.maintainer;
		this.iconPath = new vscode.ThemeIcon("folder", this.itemColor);
	}
}
