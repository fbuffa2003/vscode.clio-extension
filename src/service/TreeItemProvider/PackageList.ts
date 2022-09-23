import * as vscode from 'vscode';
import { CreatioTreeItem } from "./CreatioTreeItem";
import { ItemType } from "./ItemType";

export class PackageList extends CreatioTreeItem {
	readonly itemColor: vscode.ThemeColor = new vscode.ThemeColor("creatio.orangePrimary");
	public contextValue = 'CreatioPackageList';
	constructor() {
		super("Packages", "", ItemType.packageList, vscode.TreeItemCollapsibleState.Collapsed);
		this.iconPath = new vscode.ThemeIcon("folder", this.itemColor);
		this.items.push(new Package("Package One"));
		this.items.push(new Package("Package Two"));
		this.items.push(new Package("Package Three"));
		this.items.push(new Package("Package Four"));

	}
}

export class Package extends CreatioTreeItem {
	public contextValue = 'CreatioPackage';
	readonly itemColor: vscode.ThemeColor = new vscode.ThemeColor("creatio.orangeSecondary");
	constructor(packageName: string) {
		super(packageName, "", ItemType.packageItem, vscode.TreeItemCollapsibleState.None);
		this.iconPath = new vscode.ThemeIcon("folder", this.itemColor);
	}
}
