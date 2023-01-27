import { PowerShell } from 'node-powershell/dist';
import * as fs from 'node:fs/promises';
import path = require('node:path');
import * as vscode from 'vscode';
import { ClioExecutor } from '../clioExecutor';
import { pgClient } from '../pgclient';

export class decompressor {

	private _zipFileUri : vscode.Uri;
	public get zipFileUri() : vscode.Uri {
		return this._zipFileUri;
	}
	private set zipFileUri(v : vscode.Uri) {
		this._zipFileUri = v;
	}
	
	
	private _postgresPod : string = '';
	private get postgresPod() : string {
		return this._postgresPod;
	}
	private set postgresPod(v : string) {
		this._postgresPod = v;
	}
	
	
	private _templateDbName : string = '';
	private get templateDbName() : string {
		return this._templateDbName;
	}
	private set templateDbName(v : string) {
		this._templateDbName = v;
	}
	
	private _unzippedFolder : vscode.Uri | undefined;
	public get unzippedFolder() : vscode.Uri | undefined {
		return this._unzippedFolder;
	}
	public set unzippedFolder(v : vscode.Uri | undefined){
		this._unzippedFolder = v;
	}
	

	private _destination? : vscode.Uri;
	private _dbImages: vscode.Uri;
	private _pg : pgClient;

	constructor(zipFileUri: vscode.Uri) {
		this._zipFileUri = zipFileUri;	
		const configuration = vscode.workspace.getConfiguration();
		const dbImagesPath = configuration.get<string>("k8s.dbImages") ?? '';
		this._dbImages = vscode.Uri.file(dbImagesPath);
		this._pg = new pgClient();

	}

	public dispose(): void{
		if(this._pg){
			this._pg.dispose();
		}
	}

	public async Execute(progress : vscode.Progress<{
		message?: string | undefined;
		increment?: number | undefined;
	}>){

		progress.report({
			increment: 0,
			message: "Decompressing Archive"
		});
		await this.decompressArchiveToFolder();

		progress.report({
			increment: 30,
			message: "Copying backup file"
		});
		await this.copyDbFile();
		
		progress.report({
			increment: 10,
			message: "Generating template name"
		});
		await this.generateTemplateDbName();

		progress.report({
			increment: 5,
			message: "Dropping existing template"
		});
		await this.dropDbIfExists();


		progress.report({
			increment: 5,
			message: "Creating new template database"
		});
		await this.createTemplateDbAsync();
		
		progress.report({
			increment: 5,
			message: "Adding comment to template database"
		});
		await this.addCommentAsync();
		
		progress.report({
			increment: 30,
			message: "Restoring template database"
		});
		await this.restoreTemplateDbAsync();


		progress.report({
			increment: 5,
			message: "Deleting dbImage"
		});
		await this.deleteDbImage();

		progress.report({
			increment: 0,
			message: "Creating Install template"
		});
		await this.createTemplateFolderInInstallRoot();
		
		progress.report({
			increment: 10,
			message: "Done"
		});
	}

	private async decompressArchiveToFolder(){
		const sz = vscode.Uri.file("C:\\Program Files\\7-Zip\\7z.exe");
		const zipPath = path.parse(this.zipFileUri.fsPath);
		const destDir = vscode.Uri.joinPath(vscode.Uri.file(zipPath.dir),zipPath.name);
		
		const command: string  = `&'${sz.fsPath}' x ${this.zipFileUri.fsPath} -y -r -o${destDir.fsPath}`;
		await PowerShell.$`Invoke-Expression ${command}`;
		this._unzippedFolder = destDir;
		
		
		// vscode.window.withProgress(
		// 	{
		// 		location : vscode.ProgressLocation.Notification,
		// 		title: "Extracting zip archive"
		// 	},
		// 	async(progress, token)=>{
		// 		const command: string  = `&'${sz.fsPath}' x ${this.zipFileUri.fsPath} -y -r -o${destDir.fsPath}`;
		// 		await PowerShell.$`Invoke-Expression ${command}`;
		// 		this._unzippedFolder = destDir;
		// 		progress.report({
		// 			increment: 100,
		// 			message: "Done"
		// 		});
		// 	}
		// );
	}

	/**
	 * Copy db.backup file from _unzippedFolder to wsl\dbImages
	 */
	private async copyDbFile(): Promise<void>{
		if(!this._unzippedFolder){
			return;
		}

		const dbFolder = vscode.Uri.joinPath(this._unzippedFolder,"db");
		const backupFiles = await fs.readdir(dbFolder.fsPath);

		const dirName = path.parse(this._unzippedFolder.fsPath ?? '').base;	
		const destinationFileName = `template_${dirName}.backup`;
		this._destination = vscode.Uri.joinPath(this._dbImages, destinationFileName);
		
		if(backupFiles.length === 1 && backupFiles[0].endsWith('backup')){
			const backupFile = vscode.Uri.joinPath(dbFolder, backupFiles[0]);
			await fs.cp(backupFile.fsPath, this._destination.fsPath);
			
			const images = await fs.readdir(this._dbImages.fsPath);
			const isFound = images.find(i=> i === destinationFileName);
			if(isFound){
				console.log('copied successfully');
				await fs.rm(backupFile.fsPath);
				await fs.rmdir(dbFolder.fsPath);
				return;
			}else{
				throw new Error("Could not find file after copy");
			}
		}
	}

	private async findPostgresPod(): Promise<void>{
		
		const configuration = vscode.workspace.getConfiguration();
		const clusterAppLabel = configuration.get<string>("k8s.postgres.appLabel") ?? '';
		const psCommand = `kubectl get pods -n creatio --no-headers -l app=${clusterAppLabel} -o custom-columns=NAME:.metadata.name`;
		
		const psResult =  await PowerShell.$`Invoke-Expression ${psCommand}`;
		if(!psResult.hadErrors){
			this.postgresPod = psResult.raw.toString().trim();
		}else{
			throw new Error(`COULD FIND POD WITH LABEL: ${clusterAppLabel}`);
		}
	}

	private async generateTemplateDbName(): Promise<void>{
		const templates = await this._pg.getTemplatesAsync();
		let x = 1;
		let dbName = `template_creatio_${x}`;
		while(templates.get(dbName)){
			x +=1;
			dbName = `template_creatio_${x}`;
		}
		this.templateDbName = dbName;
	}

	private async dropDbIfExists(): Promise<void>{
		await this._pg.dropIfExistsAsync(this.templateDbName);
	}
	
	private async createTemplateDbAsync(): Promise<void>{
		await this._pg.createTemplateDbAsync(this.templateDbName);
	}
	
	private async restoreTemplateDbAsync(): Promise<void>{
		await this.findPostgresPod();
		const dbBackupPath = "/usr/local/dbimages"; // path where dbImages volume is mounted, see pg deployment
		
		const dirName = path.parse(this._unzippedFolder?.fsPath ?? '').base;	
		const dbFileName = `template_${dirName}.backup`;

		const pg_restoreCmd = `pg_restore -U postgres -j 4 --no-owner --no-privilege -d ${this.templateDbName} ${dbBackupPath}/${dbFileName}`;
		const psCommand = `kubectl exec -it -n creatio ${this.postgresPod} -- ${pg_restoreCmd}`;
		console.log(psCommand);
		
		const ex = new ClioExecutor();
		await ex.ExecuteClioCommand(psCommand);
	}
	
	private async addCommentAsync(): Promise<void>{

		try{
			const dirName = path.parse(this._unzippedFolder?.fsPath ?? '').base;
			await this._pg.addCommentToDb(this.templateDbName, dirName);

		}catch(error){
			const err = error as any;
			throw new Error(`COULD NOT ADD DB COMMENT ${err.message}`);
		}
	}

	private async deleteDbImage(): Promise<void>{
		try{
			if(this._destination){
				await fs.rm(this._destination.fsPath);
			}
		}
		catch(error){
			const err = error as any;
			const msg = `COULD NOT DELETE DB-IMAGE FILE ${err.message}`;
			vscode.window.showErrorMessage(msg);
			//throw new Error(msg);
		}
	}

	private async createTemplateFolderInInstallRoot(): Promise<void>{

		//this.unzippedFolder = vscode.Uri.file("C:\\Build\\8.0.6.3191_SalesEnterprise_Marketing_ServiceEnterprise_Softkey_PostgreSQL_ENU");

		if(!this._unzippedFolder){
			vscode.window.showErrorMessage("unzippedFolder is empty");
			return;
		}
		const configuration = vscode.workspace.getConfiguration();
		const installRoot = configuration.get<string>("installRoot") ?? 'C:\\inetpub\\wwwroot';
		const prefix= configuration.get<string>("templatePrefix") ?? 'template_';

		const dirName = path.parse(this._unzippedFolder.fsPath ?? '').base;
		const destination = vscode.Uri.joinPath(vscode.Uri.file(installRoot), `${prefix}${dirName}`);

		
		try{
			await fs.cp(this._unzippedFolder.fsPath, destination.fsPath, {recursive: true});
		}
		catch(error){
			const err = error as any;
			const msg = `COULD NOT COPY INSTALL FILES FROM ${this._unzippedFolder.fsPath} to ${destination.fsPath}`;
			vscode.window.showErrorMessage(msg);
			throw new Error(msg);
		}
	}
}
