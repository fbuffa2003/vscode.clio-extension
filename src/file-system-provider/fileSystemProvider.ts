import path = require("path");
import { TextEncoder } from "util";
import * as vscode from "vscode";
import { CreatioClient } from "../common/CreatioClient/CreatioClient";
import { ItemType } from "../service/TreeItemProvider/ItemType";

export class CreatioFS implements vscode.FileSystemProvider {
	root = new Directory("");
	private _clients: Array<IEnvironmentClient> = [];

	//#region manage file events
	private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
	private _bufferedEvents: vscode.FileChangeEvent[] = [];
	private _fireSoonHandle?: NodeJS.Timer;
	onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event;
	//#endregion

	watch(
		uri: vscode.Uri,
		options: { readonly recursive: boolean; readonly excludes: readonly string[] }
	): vscode.Disposable {
		// ignore, fires for all changes...
		return new vscode.Disposable(() => {});
	}
	stat(uri: vscode.Uri): vscode.FileStat | Thenable<vscode.FileStat> {
		const parts = uri.path.split("/");
		const fileName = parts[3];
		return new File(fileName);
	}
	readDirectory(
		uri: vscode.Uri
	): [string, vscode.FileType][] | Thenable<[string, vscode.FileType][]> {
		throw new Error("Method not implemented.");
	}
	createDirectory(uri: vscode.Uri): void | Thenable<void> {
		const basename = path.posix.basename(uri.path);
		const dirname = uri.with({ path: path.posix.dirname(uri.path) });
		const parent = this._lookupAsDirectory(dirname, false);

		const entry = new Directory(basename);
		parent.entries.set(entry.name, entry);
		parent.mtime = Date.now();
		parent.size += 1;
	}
	readFile(uri: vscode.Uri): Uint8Array | Thenable<Uint8Array> {
		const file = this._lookupAsFile(uri, false);
		const data = file.data;
		if (!data) {
			throw vscode.FileSystemError.FileNotFound();
		}

		if (!file.isCreatioContentLoaded) {
			const parts = uri.path.split("/");
			const envName = parts[1];
			if (!envName) {
				throw vscode.FileSystemError.FileNotFound("Could not get environment");
			}
			const client = this._clients.find((c) => c.name === envName)?.client;

			const searchParam = new URLSearchParams(uri.query);
			const itemTypeIndex = Number.parseInt(searchParam.get("itemType") ?? "");
			const uid = searchParam.get("uId");
			if (!uid) {
				throw vscode.FileSystemError.FileNotFound("Could not find file");
			}
			return new Promise<Uint8Array>(async (resole, reject) => {
				file.fullSchema = await client?.GetSchemaAsync(itemTypeIndex, uid, false) ?? {};
				const schemaBody = (file.fullSchema as any)['body'];
				const te = new TextEncoder();
				const encoded = te.encode(schemaBody);
				file.data = encoded;
				file.isDirty = false;
				file.isCreatioContentLoaded = true;
				resole(file.data);
			});
		} else {
			return data;
		}
	}
	writeFile(uri: vscode.Uri, content: Uint8Array,	options: { 
		readonly create: boolean; 
		readonly overwrite: boolean, 
		readonly isInit:boolean|undefined, 
		readonly itemType : ItemType|undefined
	}): void | Thenable<void> 
	{
		const basename = path.posix.basename(uri.path);
		const parent = this._lookupParentDirectory(uri);
		let entry = parent.entries.get(basename);
		if (entry instanceof Directory) {
			throw vscode.FileSystemError.FileIsADirectory(uri);
		}
		if (!entry && !options.create) {
			throw vscode.FileSystemError.FileNotFound(uri);
		}
		if (entry && options.create && !options.overwrite) {
			throw vscode.FileSystemError.FileExists(uri);
		}
		if (!entry) {
			entry = new File(basename);
			parent.entries.set(basename, entry);
			entry.itemType = options.itemType;
			this._fireSoon({ type: vscode.FileChangeType.Created, uri });
		}
		entry.mtime = Date.now();
		entry.size = content.byteLength;
		entry.data = content;
		if(options.isInit && options.isInit === true){
			entry.isDirty = false;
		}else{
			
			entry.isDirty = true;
			const parts = uri.path.split("/");
			const envName = parts[1];
			const client = this._clients.find((c) => c.name === envName)?.client;
			const fullSchema = (entry as File).getSchemaForUpload();
			
			vscode.window
			.showWarningMessage(`Would you like to upload + ${basename} to ${envName} ?`, "Yes", "No",)
			.then(answer => {
				if (answer === "Yes") {
					vscode.window.withProgress(
						{
							location : vscode.ProgressLocation.Notification,
							title: `Saving schema (${basename})`,
							cancellable: true
						},
						async(progress, token)=>{
							const file = entry as File;
							if(file.itemType){
								const result = await client?.SaveSchemaAsync(fullSchema, file.itemType);
							}
		
							progress.report({
								increment: 100,
								message: "Done"
							});
		
							token.onCancellationRequested(_=>{
								progress.report({ 
									increment: 100, 
									message: "Cancelled" 
								});
							});
						}
					);
				}
			});


			
		}
		this._fireSoon({ type: vscode.FileChangeType.Changed, uri });
	}
	delete(uri: vscode.Uri, options: { readonly recursive: boolean }): void | Thenable<void> {
		return;
	}
	rename(
		oldUri: vscode.Uri,
		newUri: vscode.Uri,
		options: { readonly overwrite: boolean }
	): void | Thenable<void> {
		throw new Error("Method not implemented.");
	}

	// --- lookup

	private _lookup(uri: vscode.Uri, silent: false): Entry;
	private _lookup(uri: vscode.Uri, silent: boolean): Entry | undefined;
	private _lookup(uri: vscode.Uri, silent: boolean): Entry | undefined {
		const parts = uri.path.split("/");
		let entry: Entry = this.root;
		for (const part of parts) {
			if (!part) {
				continue;
			}
			let child: Entry | undefined;
			if (entry instanceof Directory) {
				child = entry.entries.get(part);
			}
			if (!child) {
				if (!silent) {
					throw vscode.FileSystemError.FileNotFound(uri);
				} else {
					return undefined;
				}
			}
			entry = child;
		}
		return entry;
	}

	private _lookupAsDirectory(uri: vscode.Uri, silent: boolean): Directory {
		const entry = this._lookup(uri, silent);
		if (entry instanceof Directory) {
			return entry;
		}
		throw vscode.FileSystemError.FileNotADirectory(uri);
	}

	private _lookupAsFile(uri: vscode.Uri, silent: boolean): File {
		const entry = this._lookup(uri, silent);
		if (entry instanceof File) {
			return entry;
		}
		throw vscode.FileSystemError.FileIsADirectory(uri);
	}

	private _lookupParentDirectory(uri: vscode.Uri): Directory {
		const dirname = uri.with({ path: path.posix.dirname(uri.path) });
		return this._lookupAsDirectory(dirname, false);
	}

	public addClient(client: IEnvironmentClient) {
		const uri = vscode.Uri.parse(`creatio:/${client.name}`);
		this.createDirectory(uri);

		if (this._clients.findIndex((c) => c.name === client.name) === -1) {
			this._clients.push(client);
		}
	}

	private _fireSoon(...events: vscode.FileChangeEvent[]): void {
		this._bufferedEvents.push(...events);

		if (this._fireSoonHandle) {
			clearTimeout(this._fireSoonHandle);
		}

		this._fireSoonHandle = setTimeout(() => {
			this._emitter.fire(this._bufferedEvents);
			this._bufferedEvents.length = 0;
		}, 5);
	}
}

export class File implements vscode.FileStat {
	type: vscode.FileType;
	ctime: number;
	mtime: number;
	size: number;
	
	isDirty : boolean = false;
	isCreatioContentLoaded = false;

	name: string;
	data?: Uint8Array;
	itemType?: ItemType;


	fullSchema : object = {};
	constructor(name: string) {
		this.type = vscode.FileType.File;
		this.ctime = Date.now();
		this.mtime = Date.now();
		this.size = 0;
		this.name = name;
	}

	getSchemaForUpload(){
		(this.fullSchema as any).body = this.data?.toString();
		return this.fullSchema;
	}

}
export class Directory implements vscode.FileStat {
	type: vscode.FileType;
	ctime: number;
	mtime: number;
	size: number;

	name: string;
	entries: Map<string, File | Directory>;

	constructor(name: string) {
		this.type = vscode.FileType.Directory;
		this.ctime = Date.now();
		this.mtime = Date.now();
		this.size = 0;
		this.name = name;
		this.entries = new Map();
	}
}
export type Entry = File | Directory;
export interface IEnvironmentClient {
	client: CreatioClient;
	name: string;
}
