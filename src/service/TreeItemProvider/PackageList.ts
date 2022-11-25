import path = require('path');
import * as vscode from 'vscode';
import { IDownloadPackageArgs } from '../../commands/DownloadPackageCommand';
import { IGetPackagesArgs } from '../../commands/GetPackagesCommand';
import { IUnlockPkgArgs } from '../../commands/UnLockPkgCommand';
import { IWorkSpaceItem } from '../../common/CreatioClient/CreatioClient';
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
	
	private _isPackageRetrievalInProgress : boolean = false;
	public get isPackageRetrievalInProgress() : boolean {
		return this._isPackageRetrievalInProgress;
	}
	private set isPackageRetrievalInProgress(v : boolean) {
		this._isPackageRetrievalInProgress = v;
	}
	
	public async getPackagesDev(): Promise<void>{
		// const args : IGetPackagesArgs = {
		// 	environmentName :  this.parent?.label as string
		// };

		if(this._isPackageRetrievalInProgress){
			return;
		}
		this._isPackageRetrievalInProgress = true;
		const pkgs = await (this.parent as Environment).creatioClient.GetPackages();	
		const body = JSON.parse(pkgs.body);
		if(!body['success']){
			vscode.window.showErrorMessage(
				`${body['errorInfo']['errorCode']}: ${body['errorInfo']['message']}`
			);
			return;
		}

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
		this._isPackageRetrievalInProgress = false;
	}

	private async sort(): Promise<void>{

		const sortedPkg = new Array<Package>();
		const unlockedPkgs =(this.items as Array<Package>).filter(p=> !p.isReadOnly)
		.sort((a,b) => 0 - (a.name.toLowerCase() > b.name.toLowerCase() ? -1 : 1));
		
		const lockedPkgs = (this.items as Array<Package>).filter(p=> p.isReadOnly)
		.sort((a,b) => 0 - (a.name.toLowerCase() > b.name.toLowerCase()? -1 : 1));

		sortedPkg.push(...unlockedPkgs, ...lockedPkgs);
		this.items = sortedPkg;
	}

	private handleLockStatusUpdate(pkg : Package) {
		this.sort();
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
					destinationPath : path.join(folderPath)
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
								vscode.commands.executeCommand("revealFileInOS", folderUri[0]);
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
		await (this.parent?.parent as Environment).creatioClient.GetPackageProperties(this.uId);
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
		
		const args : IUnlockPkgArgs= {
			pkgName: this.name,
			environmentName: this.parent?.parent?.label as string
		};
		
		if((this.parent?.parent as Environment).clio.unlockPackage.canExecute(args).success){
			const result = await(this.parent?.parent as Environment).clio.unlockPackage.executeAsync(args);

			if(result.success){
				vscode.window.showInformationMessage(result.message as string);
				
				this.isReadOnly = true;
		this.contextValue = "CreatioPackageLocked";
		this.iconPath = {
			light: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'locked-package.svg'),
			dark: path.join(__filename, '..', '..', '..','..', 'resources', 'icon', 'locked-package.svg')
		};
		this._onLockStatusUpdate.fire(this);

			}else{
				vscode.window.showErrorMessage(result.message as string);
			}
		}
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
	
		const env = this.parent?.parent?.parent as Environment;
		let language = '';
		let fileName = this.name;
		let isFileContent = false;
		switch(this.itemType){
			case ItemType.clientModuleSchema:{
				language = 'javascript';
				fileName +='.js';
				isFileContent = true;
				break;
			}
			case ItemType.sqlScriptSchema:{
				language = 'sql';
				fileName +='.sql';
				isFileContent = true;
				break;
			}
			case ItemType.sourceCodeSchema:{
					language = 'csharp';
					fileName +='.cs';
					isFileContent = true;
					break;
				};
			default : {
				language = 'plaintext';
			}
		}
		
		if(!isFileContent){

			const appPath = (env.connectionSettings.isNetCore) ? "":"0";
			let link : vscode.Uri | undefined;
			
			switch(this.itemType){
				case ItemType.entitySchema:{
					const linkText = `${env.connectionSettings.uri}${appPath}/ClientApp/#/EntitySchemaDesigner/${this.uId}?packageId=${this.parent.uId}&packageName=${this.parent.name}&useFullHierarchy=true`;
					link = vscode.Uri.parse(linkText);
					break;
				}
				case ItemType.dataSchema:{
					const linkText = `${env.connectionSettings.uri}${appPath}/ClientApp/#/SchemaDataDesigner/${this.uId}`;
					link = vscode.Uri.parse(linkText);
					break;
				}
				case ItemType.businessProcessSchema:{
					//http://k_krylov_n:8005/0/Nui/ViewModule.aspx?vm=SchemaDesigner#process/da145d55-9e13-4850-b793-d144131e3849
					const linkText = `${env.connectionSettings.uri}${appPath}/Nui/ViewModule.aspx?vm=SchemaDesigner#process/${this.uId}`;
					link = vscode.Uri.parse(linkText);
					break;
				}
				case ItemType.webServiceSchema:{
					//http://k_krylov_n:8005/0/Nui/ViewModule.aspx?vm=WebServicesDesigner#CardModuleV2/WebServiceV2Page/edit/eaab0cb8-b7c8-4fc7-9ff0-535be5f59413
					const linkText = `${env.connectionSettings.uri}${appPath}/Nui/ViewModule.aspx?vm=WebServicesDesigner#CardModuleV2/WebServiceV2Page/edit/${this.uId}`;
					link = vscode.Uri.parse(linkText);
					break;
				}
				case ItemType.caseSchema:{
					//http://k_krylov_n:8005/0/Nui/ViewModule.aspx?vm=DcmDesigner#case/19f1d457-2bc6-48f9-ab6c-a5a697f30c47
					const linkText = `${env.connectionSettings.uri}${appPath}/Nui/ViewModule.aspx?vm=DcmDesigner#case/${this.uId}`;
					link = vscode.Uri.parse(linkText);
					break;
				}
				case ItemType.userTaskSchema:{
					//http://k_krylov_n:8005/0/ClientApp/#/UserTaskSchemaDesigner/b5c726f2-af5b-4381-bac6-913074144308
					const linkText = `${env.connectionSettings.uri}${appPath}/ClientApp/#/UserTaskSchemaDesigner/${this.uId}`;
					link = vscode.Uri.parse(linkText);
					break;
				}
				case ItemType.addOnSchema:{
					//http://k_krylov_n:8005/0/ClientApp/#/SchemaMetaDataDesigner/97376e01-6bb8-4cdf-a7d4-face0ff7bebe/11/06d9ef10-51d8-122c-8933-9212e84236c9
					const linkText = `${env.connectionSettings.uri}${appPath}/ClientApp/#/SchemaMetaDataDesigner/${this.uId}/${this.parent.pkgType}/${this.parent.uId}`;
					link = vscode.Uri.parse(linkText);
					break;
				}
			}
			
			if(link){
				vscode.env.openExternal(link);
			}
			return;
		}

		vscode.window.withProgress({
				location : vscode.ProgressLocation.Notification,
				title: "Getting schema content"
			},
			async(progress, token)=>{
				//UrlPath creatio:/EnvName/PackageName/Filename
				const file_uri = vscode.Uri.parse(`creatio:/${env.label}/${this.parent.name}/${fileName}?uId=${this.uId}&itemType=${this.itemType}`);
				vscode.workspace.openTextDocument(file_uri)
				.then((doc: vscode.TextDocument)=>{
					vscode.window.showTextDocument(doc);
				});

				progress.report({ 
					increment: 100, 
					message: "Done" 
				});
			}
		);
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