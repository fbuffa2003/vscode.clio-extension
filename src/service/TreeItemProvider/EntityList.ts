import * as vscode from 'vscode';
import { CreatioTreeItem } from "./CreatioTreeItem";
import { ItemType } from "./ItemType";

export class EntityList extends CreatioTreeItem {
	public contextValue = 'CreatioEntityList';
	readonly itemColor: vscode.ThemeColor = new vscode.ThemeColor("creatio.orangePrimary");
	constructor(parent: CreatioTreeItem) {
		super("Entities", "", ItemType.entityList, parent, vscode.TreeItemCollapsibleState.Collapsed);
		this.items.push(new Entity("Contact", this));
		this.items.push(new Entity("Account", this));
		this.items.push(new Entity("Activity", this));
		this.iconPath = new vscode.ThemeIcon("table", this.itemColor);
	}
}

export class Entity extends CreatioTreeItem {
	public contextValue = 'CreatioEntity';
	readonly itemColor: vscode.ThemeColor = new vscode.ThemeColor("creatio.orangeSecondary");
	constructor(processName: string, parent: CreatioTreeItem) {
		super(processName, "", ItemType.processItem, parent, vscode.TreeItemCollapsibleState.None);
		this.iconPath = new vscode.ThemeIcon("table", this.itemColor);
	}
}
