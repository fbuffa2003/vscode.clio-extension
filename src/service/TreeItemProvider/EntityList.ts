import * as vscode from 'vscode';
import { CreatioTreeItem } from "./CreatioTreeItem";
import { ItemType } from "./ItemType";

export class EntityList extends CreatioTreeItem {
	public contextValue = 'CreatioEntityList';
	readonly itemColor: vscode.ThemeColor = new vscode.ThemeColor("creatio.orangePrimary");
	constructor() {
		super("Entities", "", ItemType.entityList, vscode.TreeItemCollapsibleState.Collapsed);
		this.items.push(new Entity("Contact"));
		this.items.push(new Entity("Account"));
		this.items.push(new Entity("Activity "));
		this.iconPath = new vscode.ThemeIcon("table", this.itemColor);
	}
}

export class Entity extends CreatioTreeItem {
	public contextValue = 'CreatioEntity';
	readonly itemColor: vscode.ThemeColor = new vscode.ThemeColor("creatio.orangeSecondary");
	constructor(processName: string) {
		super(processName, "", ItemType.processItem, vscode.TreeItemCollapsibleState.None);
		this.iconPath = new vscode.ThemeIcon("table", this.itemColor);
	}
}
