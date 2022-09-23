import * as vscode from 'vscode';
import { CreatioTreeItem } from "./CreatioTreeItem";
import { ItemType } from "./ItemType";




export class ProcessList extends CreatioTreeItem {
	public contextValue = 'CreatioProcessList';
	readonly itemColor: vscode.ThemeColor = new vscode.ThemeColor("creatio.startIcon");

	constructor(parent: CreatioTreeItem) {
		super("Business Processes", "", ItemType.processList, parent, vscode.TreeItemCollapsibleState.Collapsed);
		this.items.push(new Process("Process One", this));
		this.items.push(new Process("Process Two", this));
		this.items.push(new Process("Process Three", this));
		this.items.push(new Process("Process Four", this));
		this.iconPath = new vscode.ThemeIcon("run", this.itemColor);
	}
}

export class Process extends CreatioTreeItem {
	public contextValue = 'CreatioProcess';
	readonly itemColor: vscode.ThemeColor = new vscode.ThemeColor("creatio.blue");
	constructor(processName: string, parent: CreatioTreeItem) {
		super(processName, "", ItemType.processItem, parent, vscode.TreeItemCollapsibleState.None);
		this.iconPath = new vscode.ThemeIcon("file", this.itemColor);
	}
}
