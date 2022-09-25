import { link } from 'fs';
import path = require('path');
import { title } from 'process';
import * as vscode from 'vscode';
import { IDownloadPackageArgs, IDownloadPackageResponse } from '../../commands/DownloadPackageCommand';
import { IGetPackagesArgs } from '../../commands/GetPackagesCommand';
import { IUnlockPkgArgs } from '../../commands/UnLockPkgCommand';
import { IPackage, IWorkSpaceItem } from '../../common/CreatioClient/CreatioClient';
import { CreatioTreeItem } from "./CreatioTreeItem";
import { Environment } from './Environment';
import { ItemType } from "./ItemType";

export class PackageList extends CreatioTreeItem {

	public contextValue = 'CreatioPackageList';
	
	
	private _WorkspaceItems : Array<IWorkSpaceItem> = new Array<IWorkSpaceItem>;
	public get WorkspaceItems() : Array<IWorkSpaceItem> {
		return this._WorkspaceItems;
	}
	public set WorkspaceItems(v : Array<IWorkSpaceItem>) {
		this._WorkspaceItems = v;
	}
	
	constructor(parent: CreatioTreeItem ) {
		super("Packages", "", ItemType.packageList, parent,vscode.TreeItemCollapsibleState.Collapsed);
		this.iconPath = {
			light: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'unlocked-package.svg'),
			dark: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'unlocked-package.svg')
		};
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
				const p = new Package(pkg.name, pkg.version, pkg.maintainer, pkg.uId, 0, true, 
					
					new Array<IWorkSpaceItem>(),
					this);
				p.onLockStatusUpdate((target: Package)=>{
					this.handleLockStatusUpdate(target);
				});
				this.items.push(p);
			});

			await this.sort();
		}
	}

	public async getPackagesDev(): Promise<void>{
		const args : IGetPackagesArgs = {
			environmentName :  this.parent?.label as string
		};
		const pkgs = await (this.parent as Environment).creatioClient.GetPackages();	
		this.WorkspaceItems = await (this.parent as Environment).creatioClient.GetWorkspaceItems();

		pkgs.packages.forEach(pkg => {
			const wsi = this.WorkspaceItems.filter(i=> i.packageName === pkg.name);
			const p = new Package(pkg.name, pkg.version, pkg.maintainer, pkg.uId, pkg.type, pkg.isReadOnly, wsi, this);
			
			p.onLockStatusUpdate((target: Package)=>{
				this.handleLockStatusUpdate(target);
			});
			this.items.push(p);
		});
		await this.sort();
	}

	private async sort(): Promise<void>{

		const sortedPkg = new Array<Package>();
		const unlockedPkgs =(this.items as Array<Package>).filter(p=> !p.isReadOnly)
		.sort((a,b) => 0 - (a.name > b.name ? -1 : 1));
		
		const lockedPkgs = (this.items as Array<Package>).filter(p=> p.isReadOnly)
		.sort((a,b) => 0 - (a.name > b.name ? -1 : 1));

		sortedPkg.push(...unlockedPkgs, ...lockedPkgs);
		this.items = sortedPkg;
	}

	private handleLockStatusUpdate(pkg : Package) {
		this.sort();
		console.log("Sort done");
	}

	
}

export class Package extends CreatioTreeItem {
	
	protected _onLockStatusUpdate: vscode.EventEmitter<Package> = new vscode.EventEmitter<Package>();
	readonly onLockStatusUpdate: vscode.Event<Package> = this._onLockStatusUpdate.event;

	public contextValue = 'CreatioPackage';
	public readonly name : string;
	public readonly version : string;
	public readonly maintainer: string;
	public readonly uId: string;
	public readonly pkgType: number;
	private _isReadOnly : boolean;
	public get isReadOnly() : boolean {
		return this._isReadOnly;
	}
	private set isReadOnly(v : boolean) {
		this._isReadOnly = v;
	}
	
	public readonly packageProperties: IPackageProperties | undefined;
	readonly itemColor: vscode.ThemeColor = new vscode.ThemeColor("creatio.orangeSecondary");	
	constructor(name: string, version: string, maintainer: string, uId:string, 
		
		pkgType: number, isReadOnly: boolean, workSpaceItem : Array<IWorkSpaceItem>, parent: CreatioTreeItem) 
		{
			super(name, version, ItemType.packageItem, parent, 
				(workSpaceItem?.length === 0) ? vscode.TreeItemCollapsibleState.None:vscode.TreeItemCollapsibleState.Collapsed
		);

		this.name = name;
		this.version = version;
		this.maintainer  = maintainer;
		this.tooltip = this.maintainer;
		this.uId = uId;
		this.pkgType = pkgType;
		this._isReadOnly = isReadOnly;
		
		if(this.isReadOnly){
			this.contextValue = "CreatioPackageLocked";
			this.iconPath = {
				light: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'locked-package.svg'),
				dark: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'locked-package.svg')
			};
		}else{
			this.contextValue = "CreatioPackageUnLocked";
			this.iconPath = {
				light: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'unlocked-package.svg'),
				dark: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'unlocked-package.svg')
			};
		}

		workSpaceItem.forEach(item=>{
			switch(item.type){
				case 0:{
					const i = new WorkSpaceItem(item.name, item.title ?? "", ItemType.sqlScriptSchema, item.uId,this);
					this.items.push(i);
					break;
				}
				case 1:{
					const i = new WorkSpaceItem(item.name, item.title ?? "" , ItemType.dataSchema,item.uId, this);
					this.items.push(i);
					break;
				}
				case 2:{
					const i = new WorkSpaceItem(item.name, item.title ?? "", ItemType.dll, item.uId,this);
					this.items.push(i);
					break;
				}
				case 3:{
					const i = new WorkSpaceItem(item.name, item.title ?? "", ItemType.entitySchema, item.uId,this);
					this.items.push(i);
					break;
				}
				case 4:{
					const i = new WorkSpaceItem(item.name, item.title ?? "", ItemType.clientModuleSchema,item.uId, this);
					this.items.push(i);
					break;
				}
				case 5:{
					const i = new WorkSpaceItem(item.name, item.title ?? "", ItemType.sourceCodeSchema,item.uId, this);
					this.items.push(i);
					break;
				}
				case 6:{
					const i = new WorkSpaceItem(item.name, item.title ?? "", ItemType.businessProcessSchema,item.uId, this);
					this.items.push(i);
					break;
				}
				case 7:{
					const i = new WorkSpaceItem(item.name, item.title ?? "", ItemType.caseSchema,item.uId, this);
					this.items.push(i);
					break;
				}
				case 8:{
					const i = new WorkSpaceItem(item.name, item.title ?? "", ItemType.userTaskSchema, item.uId,this);
					this.items.push(i);
					break;
				}
				
				case 10:{
					const i = new WorkSpaceItem(item.name, item.title ?? "", ItemType.webServiceSchema, item.uId,this);
					this.items.push(i);
					break;
				}
				case 11:{
					const i = new WorkSpaceItem(item.name, item.title ?? "", ItemType.addOnSchema,item.uId, this);
					this.items.push(i);
					break;
				}
			}
		});
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

	public async GetPackageProperties(){
		const properties = await (this.parent?.parent as Environment).creatioClient.GetPackageProperties(this.uId);
	}

	public async unlock(){
		const args : IUnlockPkgArgs= {
			pkgName: this.name,
			environmentName: this.parent?.parent?.label as string
		};

		if((this.parent?.parent as Environment).clio.unlockPackage.canExecute(args).success){
			const result = await(this.parent?.parent as Environment).clio.unlockPackage.executeAsync(args);

			if(result.success){
				vscode.window.showInformationMessage(result.message as string);
				
				this.isReadOnly = false;
				this.contextValue = "CreatioPackageUnLocked";
				this.iconPath = {
					light: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'unlocked-package.svg'),
					dark: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'unlocked-package.svg')
				};
				this._onLockStatusUpdate.fire(this);

			}else{
				vscode.window.showErrorMessage(result.message as string);
			}
		}
	}

	public async lock(){
		this.isReadOnly = true;
		this.contextValue = "CreatioPackageLocked";
		this.iconPath = {
			light: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'locked-package.svg'),
			dark: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'locked-package.svg')
		};
		this._onLockStatusUpdate.fire(this);
		vscode.window.showErrorMessage("Lock package command is not implemented");
	}
}


export class WorkSpaceItem extends CreatioTreeItem{
	
	public readonly shemaContent: string | undefined;

	/**
	 *
	 */
	constructor(
		public readonly name : string ,
		public readonly description: string, 
		public readonly itemType: ItemType,
		public readonly uId : string,
		public readonly parent: Package,) 
		{
			super(name, description, itemType,
				parent, vscode.TreeItemCollapsibleState.None);
				this.setIcon();
		}

	public async showContent(): Promise<void>{
		
			let language = '';
			switch(this.itemType){
				case ItemType.clientModuleSchema:{
					language = 'javascript';
					break;
				}
				case ItemType.sqlScriptSchema:{
					language = 'sql';
					break;
				}
				case ItemType.sourceCodeSchema:{
						language = 'csharp';
						break;
					};
				default : {
					language = 'plaintext';
				}
			}
			let schema : string;
			
			vscode.window.withProgress({
					location : vscode.ProgressLocation.Notification,
					title: "Getting schema content"
				},
				async(progress, token)=>{
					schema = await (this.parent?.parent?.parent as Environment)
						.creatioClient.GetSchemaAsync(this.itemType, this.uId, false);

					progress.report({ 
						increment: 100, 
						message: "Done" 
					});
				}
			).then(()=>{
				vscode.workspace.openTextDocument({
					language: language,
					content: schema
				});
			});
	}

	private setIcon(){
		switch (this.itemType){
			case ItemType.sqlScriptSchema :{
				this.iconPath = {
					light: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'schema-sql.svg'),
					dark: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'schema-sql.svg')
				};
				this.contextValue = 'sqlScriptSchema';
				break;
			}
			case ItemType.dataSchema :{
				this.iconPath = {
					light: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'schema-data.svg'),
					dark: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'schema-data.svg')
				};
				this.contextValue = 'dataSchema';
				break;
			}
			
			case ItemType.dll :{
				this.iconPath = {
					light: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'schema-dll.svg'),
					dark: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'schema-dll.svg')
				};
				this.contextValue = 'dll';
				break;
			}
			case ItemType.entitySchema :{
				this.iconPath = {
					light: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'schema-entity.svg'),
					dark: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'schema-entity.svg')
				};
				this.contextValue = 'entityModuleSchema';
				break;
			}
			case ItemType.clientModuleSchema :{
				this.iconPath = {
					light: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'schema-js.svg'),
					dark: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'schema-js.svg')
				};
				this.contextValue = 'clientModuleSchema';
				break;
			}
			case ItemType.sourceCodeSchema :{
				this.iconPath = {
					light: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'schema-cs.svg'),
					dark: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'schema-cs.svg')
				};
				this.contextValue = 'sourceCodeSchema';
				break;
			}
			case ItemType.businessProcessSchema :{
				this.iconPath = {
					light: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'schema-bp.svg'),
					dark: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'schema-bp.svg')
				};
				this.contextValue = 'businessProcessSchema';
				break;
			}
			case ItemType.caseSchema :{
				this.iconPath = {
					light: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'schema-case.svg'),
					dark: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'schema-case.svg')
				};
				this.contextValue = 'caseSchema';
				break;
			}
			case ItemType.userTaskSchema :{
				this.iconPath = {
					light: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'schema-ut.svg'),
					dark: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'schema-ut.svg')
				};
				this.contextValue = 'userTaskSchema';
				break;
			}
			case ItemType.webServiceSchema :{
				this.iconPath = {
					light: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'schema-ws.svg'),
					dark: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'schema-ws.svg')
				};
				this.contextValue = 'webServiceSchema';
				break;
			}
			case ItemType.addOnSchema :{
				this.iconPath = {
					light: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'schema-addon.svg'),
					dark: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'schema-addon.svg')
				};
				this.contextValue = 'addOnSchema';
				break;
			}
		}
	}
}


export interface IPackageProperties{

	createdBy: string,
	createdOn: Date,
	description: string,
	id: string,
	maintainer: string,
	modifiedBy: string,
	modifiedOn: Date,
	name: string,
	position: number,
	type: number,
	uId: string,
	version: string,
	dependsOnPackages: Array<IPackageProperties>,
	dependentPackages: Array<IPackageProperties>
}