import * as vscode from 'vscode';
import { Clio } from '../../commands/Clio';
import { ItemType } from './ItemType';


export abstract class CreatioTreeItem extends vscode.TreeItem {
	protected readonly itemColor?: vscode.ThemeColor;
	protected _onDidStatusUpdate: vscode.EventEmitter<CreatioTreeItem> = new vscode.EventEmitter<CreatioTreeItem>();
	readonly onDidStatusUpdate: vscode.Event<CreatioTreeItem> = this._onDidStatusUpdate.event;
	protected _onDeleted: vscode.EventEmitter<CreatioTreeItem> = new vscode.EventEmitter<CreatioTreeItem>();
	readonly onDeleted: vscode.Event<CreatioTreeItem> = this._onDeleted.event;
	readonly clio: Clio = new Clio();
	public readonly parent : CreatioTreeItem | undefined;
	public items: Array<CreatioTreeItem> = new Array<CreatioTreeItem>();

	constructor(
		public readonly label: string,
		description: string,
		public readonly itemType: ItemType,
		parent : CreatioTreeItem | undefined,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState
	) {
		super(label, collapsibleState);
		this.parent = parent;
		this.tooltip = description;
		this.description = description;
		this.itemType = itemType;
	}
}
