import * as vscode from 'vscode';
import { CreatioTreeItem } from "./CreatioTreeItem";
import { ItemType } from "./ItemType";




export class ProcessList extends CreatioTreeItem {
	public contextValue = 'CreatioProcessList';
	readonly itemColor: vscode.ThemeColor = new vscode.ThemeColor("creatio.startIcon");

	constructor() {
		super("Business Processes", "", ItemType.processList, vscode.TreeItemCollapsibleState.Collapsed);
		this.items.push(new Process("Process One"));
		this.items.push(new Process("Process Two"));
		this.items.push(new Process("Process Three"));
		this.items.push(new Process("Process Four"));
		this.iconPath = new vscode.ThemeIcon("run", this.itemColor);
	}
}

export class Process extends CreatioTreeItem {
	public contextValue = 'CreatioProcess';
	readonly itemColor: vscode.ThemeColor = new vscode.ThemeColor("creatio.blue");
	constructor(processName: string) {
		super(processName, "", ItemType.processItem, vscode.TreeItemCollapsibleState.None);
		this.iconPath = new vscode.ThemeIcon("file", this.itemColor);
	}
}
