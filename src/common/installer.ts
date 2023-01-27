import * as fs from 'node:fs/promises';
import { PowerShell } from 'node-powershell';
import { Dir } from 'node:fs';
import { pgClient } from './pgclient';
import * as vscode from 'vscode';

export interface Iinstaller{

	/**
	 * Create template directory for new Installation and copy files into it
	 */
	 createTemplateDirectory(): Promise<void>;


	/**
	 * Create database from previously restored template
	 */
	createDbFromTemplateAsync(): Promise<void>;


	/**
	 * Update Connection string for new site
	 */
	updateConnectionString():Promise<void>;


	/**
	 * Create IIS Site and IIS Pool for the site
	 */
	createIISSiteAsync(): Promise<void>;

}

export class installer implements Iinstaller {

	private readonly _hostname : string = 'localhost';
	private readonly _archivePath : string;
	private readonly _installRoot : string ;
	private readonly _templatePrefix: string;
	
	private _appName : string;
	public get appName() : string {
		return this._appName.toLowerCase();
	}
	private set appName(v : string) {
		this._appName = v;
	}
	
	private _folder_name : string;
	public get folder_name() : string {
		return this._folder_name;
	}
	private set folder_name(v : string) {
		this._folder_name = v;
	}
	
	private _iis_port : number;
	public get iis_port() : number {
		return this._iis_port;
	}
	private set iis_port(v : number) {
		this._iis_port = v;
	}
	
	private _redisDbNum : number;
	public get redisDbNum() : number {
		return this._redisDbNum;
	}
	public set redisDbNum(v : number) {
		this._redisDbNum = v;
	}
	


	/**
	 * 
	 * @param appName Application name visible in IIS
	 * @param folderName Folder inside archive folder
	 * @param iis_port IIS port where Creatio is to be deployed
	 * @param redisDbNum Redis database number
	 */
	constructor(appName: string, folderName: string, iis_port: number, redisDbNum: number) {
		this._appName = appName;
		this._folder_name = folderName;
		this._iis_port = iis_port;
		this._redisDbNum = redisDbNum;

		const configuration = vscode.workspace.getConfiguration();
		this._archivePath = configuration.get("archivePath") ?? '';
		this._installRoot = configuration.get("installRoot") ?? '';
		this._templatePrefix = configuration.get("templatePrefix") ?? '';

	}

	async createTemplateDirectory(): Promise<void> {
		const templateFolder = `${this._installRoot}\\${this._templatePrefix}${this.folder_name}`;
		await this.deleteFolderIfExists(templateFolder);
		await this.createNewFolderAsync(templateFolder);
		await this.copyInstallationFilesAsync(`${this._archivePath}\\${this.folder_name}`, templateFolder);
	}
	
	public async createDbFromTemplateAsync(): Promise<void> {
			const client = new pgClient();
			const map = await client.getTemplatesAsync();

			//TODO: Why is key, value backwards, make proper type
			let templateName = '';
			map.forEach((value, key)=>{
				if(value === this.folder_name){
					templateName = key;
				}
			});

			await client.dropIfExistsAsync(this.appName);
			await client.restoreFromTemplateAsync(this.appName, templateName);
	}
	
	public async updateConnectionString(): Promise<void> {
		
		const fileName = `${this._installRoot}\\${this.appName}\\ConnectionStrings.config`;
		const fileContent = await fs.readFile(fileName, {encoding: 'utf-8'});
		
		const lines = fileContent.split('\r\n');


		for(let i = 0; i< lines.length; i++){
			if(lines[i].trim().startsWith("<add name=\"redis\" connectionString=")){
				lines[i] = `  <add name="redis" connectionString="host=localhost;db=${this.redisDbNum};port=30379" />`;
			}
			
			if(lines[i].trim().startsWith("<add name=\"db\" connectionString=")){
				lines[i] = `  <add name="db" connectionString="Server=localhost;Port=30432;Database=${this.appName};User ID=postgres;password=root;Timeout=500; CommandTimeout=400;MaxPoolSize=1024;" />`;
			}
		}
		
		let content ='';
		for(let i = 0; i< lines.length; i++){

			content += lines[i]+"\r\n";

		}
		fs.writeFile(fileName, content);
	}
	
	public async createIISSiteAsync(): Promise<void> {

		const appPath = `${this._installRoot}\\${this.appName}`;
		const poolPath = `${this._installRoot}\\${this.appName}\\Terrasoft.WebApp`;

		const a = await PowerShell.$`New-WebAppPool -Name ${this.appName} -Force`;
		const b = await PowerShell.$`New-WebSite -Name ${this.appName} -ApplicationPool ${this.appName} -Port ${this.iis_port} -HostHeader ${this._hostname} -PhysicalPath ${appPath} -Force`;
		const c = await PowerShell.$`New-WebApplication -Name 0 -Site ${this.appName} -ApplicationPool ${this.appName} -PhysicalPath ${poolPath} -Force`;
	}
	public async renameTemplateAsync(): Promise<void>{

		const templateFolder = `${this._installRoot}\\${this._templatePrefix}${this.folder_name}`;
		const destFolder = `${this._installRoot}\\${this.appName}`;
		
		const stat = await fs.stat(templateFolder);
		if(stat.isDirectory() === true){
			await fs.rename(templateFolder, destFolder);
		}
	}

	private async deleteFolderIfExists(dir: string): Promise<void>{
		try{
			const folder : Dir = await fs.opendir(dir);
			await fs.rm(folder.path, {recursive: true});
		}
		catch (error){
			console.log(error);
		}
	}
	private async createNewFolderAsync(dir: string): Promise<void>{
		try{
			await fs.mkdir(dir);
		}
		catch (error){
			console.log(error);
		}
	}
	
	private async copyInstallationFilesAsync(fromDir: string, toDir: string): Promise<void>{
		try{
			await fs.cp(fromDir, toDir, {recursive:true});
		}
		catch (error){
			console.log(error);
		}
	}

	// public async getAvailableTemplateFolders(): Promise<string[]>{
	// 	const subs = await fs.readdir(this._installRoot);
	// 	const result = new Array<string>();
	// 	for(let i:number = 0; i< subs.length; i++){
	// 		console.log(i);
	// 		if(subs[i].startsWith(this._templatePrefix)){
	// 			const subfolder = `${this._installRoot}\\${subs[i]}`;
	// 			const isDir = await this.checkIsFolder(subfolder);
	// 			if(isDir){
	// 				const folderName = subs[i].substring(9);
	// 				result.push(folderName);
	// 			}
	// 		}
	// 	}
	// 	return result;
	// }

	// private async checkIsFolder(path: string): Promise<boolean>{
	// 	try{
	// 		const myStat = await fs.stat(path);
	// 		const isFolder =  myStat.isDirectory();
	// 		return isFolder;
	// 	}
	// 	catch(error){
	// 		console.log(error);
	// 		return false;
	// 	}
	// }
}