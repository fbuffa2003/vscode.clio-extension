import * as vscode from 'vscode';
import { request as httpRequest, ClientRequest, IncomingMessage, OutgoingHttpHeaders } from "http";
import { request as httpsRequest, RequestOptions} from "https";
import { ColumnUsage, DataValueType, LogLevel, ParameterDirection, ProcessDataValueType } from "./enums";
import { KnownRoutes } from "./KnownRoutes";
import { ItemType } from "../../service/TreeItemProvider/ItemType";
import { IRequestOptions, IResponse } from "../interfaces";
import { HttpMethod } from "../Enums";
import { WebSocket, ClientOptions } from 'ws';
import { IConnectionSettings } from '../../service/TreeItemProvider/Environment';
import { mySemVer } from '../../utilities/mySemVer';


export interface ITokenModel{
	access_token: string;
	expires_in: number;
	token_type: string;
	issuedAt: Date;
	expiresAt: Date
}

export enum CredentialsFlow{
	Form = 0,
	OAuth = 1
}
export class CreatioClient {

	private readonly _credentialsFlow : CredentialsFlow = CredentialsFlow.Form;
	private CookieValues : Array<{key: string, value:string}> = new Array<{key: string, value:string}>();
	private readonly _pathName : string;
	private readonly isNetCore : boolean;
	private readonly Settings: IConnectionSettings;
	
	private readonly username: string;
	private readonly password: string;
	private readonly url: URL;
	private oauthToken : ITokenModel | undefined;
	

	constructor(args: IConnectionSettings) {
		if(args.login && args.password){
			this._credentialsFlow = CredentialsFlow.Form;
		}
		if(args.clientId && args.clientSecret){
			this._credentialsFlow = CredentialsFlow.OAuth;
		}
		

		this.Settings = args;
		this.url = this.Settings.uri;
		this.isNetCore = this.Settings.isNetCore;
		this.username = this.Settings.login ?? '';
		this.password = this.Settings.password ?? '';
		if(this.Settings.uri.pathname === '/'){
			this._pathName = '';
		}else{
			this._pathName = this.Settings.uri.pathname;
		}
	}

	public async GetAsync(options: IRequestOptions): Promise<IResponse>{
		
		if(this._credentialsFlow === CredentialsFlow.Form){
			if(this.CookieValues.length === 0){
				await this.Login();
			}
		}
		else{
			await this.GetTokenAsync();
		}

		const headers : OutgoingHttpHeaders = {
			"Accept-Encoding":"gzip, deflate, br",
		};

		const firstRequest =  await this.execute(
			options.path,
			HttpMethod.GET, headers);
		if(firstRequest.statusCode === 401){
			await this.Login();
			const result =  await this.execute(
				options.path,
				HttpMethod.GET, headers);
			return result;
		} else {
			return firstRequest;
		}
	}

	public async PostAsync(options: IRequestOptions): Promise<IResponse>{
		if(this._credentialsFlow === CredentialsFlow.Form){
			if(this.CookieValues.length === 0){
				await this.Login();
			}
		}
		else{
			if(!this.oauthToken){
				await this.GetTokenAsync();
			}else if(this.oauthToken.expiresAt < new Date()){
				await this.GetTokenAsync();
			}
		}

		const headers : OutgoingHttpHeaders = {
			"Content-Type":"application/json",
			"Accept-Encoding":"gzip, deflate, br",
			"Content-Length": Buffer.byteLength(JSON.stringify(options.data), "utf8")
		};
		const firstRequest =  await this.execute(options.path, HttpMethod.POST, headers, options.data);
		if(firstRequest.statusCode === 401 || firstRequest.statusCode === 403){
			if(this._credentialsFlow === CredentialsFlow.Form){
				await this.Login();
			}else{
				await this.GetTokenAsync();
			}
			return this.execute(options.path, HttpMethod.POST, headers, options.data);
		} else {
			return firstRequest;
		}
	}

	public async ListProcessesAsync(): Promise<IProcessList>{
		const options : IRequestOptions = {
			path: new KnownRoutes(this.isNetCore).SelectQuery,
			data: {
				rootSchemaName: "VwProcessLib",
				useLocalization: true,
				filters: {
					items: {
						ActiveProcess: {
							filterType: 1,
							comparisonType: 3,
							isEnabled: true,
							trimDateTimeParameterToDate: false,
							leftExpression: {
								expressionType: 0,
								columnPath: "Enabled"
							},
							rightExpression: {
								expressionType: 2,
								parameter: {
									dataValueType: 1,
									value: "1"
								}
							}
						},
						ActiveVersionFilter: {
							filterType: 1,
							comparisonType: 3,
							isEnabled: true,
							trimDateTimeParameterToDate: false,
							leftExpression: {
								expressionType: 0,
								columnPath: "IsActiveVersion"
							},
							rightExpression: {
								expressionType: 2,
								parameter: {
									dataValueType: 1,
									value: true
								}
							}
						},
						
					},
					logicalOperation: 0,
					isEnabled: true,
					filterType: 6
				},
				columns: {
					items: {
						Id: {
							expression: {
								columnPath: "Id"
							}
						},
						Caption: {
							expression: {
								columnPath: "Caption"
							}
						},
						TagProperty: {
							expression: {
								columnPath: "TagProperty"
							}
						},
						SysSchemaId: {
							expression: {
								columnPath: "SysSchemaId"
							}
						},
						Enabled: {
							expression: {
								columnPath: "Enabled"
							}
						},
						Name: {
							expression: {
								columnPath: "Name"
							}
						},
						Parent: {
							expression: {
								columnPath: "Parent"
							}
						},
						ProcessSchemaType: {
							expression: {
								columnPath: "ProcessSchemaType"
							}
						}
					}
				}
			}
		};


		const data = await this.PostAsync(options);
		const json = JSON.parse(data.body);
		const newData =  data as IProcessList;
		newData.processes = json["rows"] as Array<IBusinessProcess>;
		return newData;
	}

	public async GetProcessSchemaAsync(id: string) : Promise<IProcessSchema>{
		const options : IRequestOptions = {
			path: new KnownRoutes(this.isNetCore).ProcessSchemaRequest,
			data: {uId: id}
		};

		const data =  await this.PostAsync(options);
		const processSchema = await this.ParseProcessSchema(JSON.parse(data.body));
		processSchema.body = data.body;
		processSchema.statusCode = data.statusCode;
		return processSchema;
	}

	/**
	 * Gets runtime entities
	 * @returns List of runtime Entities
	 */
	public async GetEntitySchemaManagerAsync(): Promise<IEntitySchemaManagerRequest>{

		const options : IRequestOptions = {
			path: new KnownRoutes(this.isNetCore).EntitySchemaManagerRequest,
			data: {}
		};

		const data = await this.PostAsync(options);
		const json = JSON.parse(data.body);
		const newData =  data as IEntitySchemaManagerRequest;
		newData.collection = json["collection"] as Array<IEntitySchemaManagerItem>;
		return newData;
	}

	/**
	 * 
	 * @param SchemaName Creatio table name
	 * @returns SchemaDefinition
	 */
	public async GetRuntimeEntitySchemaAsync(SchemaName:string): Promise<SchemaDefinition> {

		const options : IRequestOptions = {
			path: new KnownRoutes(this.isNetCore).RuntimeEntitySchemaRequest,
			data: {"Name": SchemaName}
		};

		const data = await this.PostAsync(options);
		const json = JSON.parse(data.body);

		let Schema = json['schema'] as SchemaDefinition;
		let uColumns = json['schema']['columns']['Items'];
		let keys = Object.keys(uColumns);
		let columns:EntitySchemaColumn[] = [];

		for (const key in keys) {
			if (Object.prototype.hasOwnProperty.call(keys, key)) {
				const element = keys[key];
				let column = uColumns[element] as EntitySchemaColumn;
				columns.push(column);
			}
		}
		Schema.columns = columns;
		return Schema;
	}

	public async FlushDb(){
		const options : IRequestOptions = {
			path: new KnownRoutes(this.isNetCore).ClearRedisDb,
			data: {}
		};
		return this.PostAsync(options);
	}

	public async RestartApp(){
		const options : IRequestOptions = {
			path: new KnownRoutes(this.isNetCore).RestartApp,
			data: {}
		};
		return this.PostAsync(options);
	}

	public async PingWebApp(): Promise<IResponse>{
		const options : IRequestOptions = {
			path: new KnownRoutes(this.isNetCore).PingWebApp,
		};
		return this.GetAsync(options);
	}

	public async PingWebHost() : Promise<IResponse> {
		const options : IRequestOptions = {
			path: new KnownRoutes(this.isNetCore).PingWebHost,
		};
		return this.GetAsync(options);
	}

	public async ExecuteSqlScript(sqlText: string): Promise<IResponse>{
		const options : IRequestOptions = {
			path: new KnownRoutes(this.isNetCore).ExecuteSqlScript,
			data: {script:sqlText}
		};
		const response = await this.PostAsync(options);
		const json = JSON.parse(JSON.parse(response.body));

		return response;
	}

	public async GetPackages() : Promise<IPackages>{
		const options : IRequestOptions = {
			path: new KnownRoutes(this.isNetCore).GetPackages,
			data: {}
		};
		const response = await this.PostAsync(options);
		const result: IPackages = {
			statusCode : response.statusCode,
			body: response.body,
			packages: JSON.parse(response.body)['packages']
		};
		return result;
	}

	public async GetPackageProperties(packageUId: string){
		const options : IRequestOptions = {
			path: new KnownRoutes(this.isNetCore).GetPackageProperties,
			data: {packageUId}
		};
		const response = await this.PostAsync(options);
		//const json = JSON.parse(response.body);
		return response;
	}

	public async GetWorkspaceItems(): Promise<Array<IWorkSpaceItem>>{
		const options : IRequestOptions = {
			path: new KnownRoutes(this.isNetCore).GetWorkspaceItems,
			data: {}
		};
		const response = await this.PostAsync(options);
		const json = JSON.parse(response.body);

		return json['items'] as Array<IWorkSpaceItem>;
	}

	public async GetSchemaAsync(itemType: ItemType, schemaUId : string, useFullHierarchy : boolean) {
		
		let route : string;
		switch(itemType){
			case ItemType.clientModuleSchema: {
				route = new KnownRoutes(this.isNetCore).GetClientUnitSchema;
				break;
			}
			case ItemType.sourceCodeSchema: {
				route = new KnownRoutes(this.isNetCore).GetSourceCodeSchema;
				break;
			}
			case ItemType.sqlScriptSchema: {
				route = new KnownRoutes(this.isNetCore).GetSqlSchema;
				break;
			}
			default:{
				throw Error("Unknown schema type");
			}
		}
		
		const options : IRequestOptions = {
			path: route,
			data: {
				schemaUId:schemaUId,
				useFullHierarchy:useFullHierarchy
			}
		};
		const response = await this.PostAsync(options);
		const json = JSON.parse(response.body);

		return json['schema'] as object;
		//return json['schema']['body'] as string;
	}

	public async SaveSchemaAsync(fullSchema: any, itemType:ItemType): Promise<Object>{
		let route : string;
		switch(itemType){
			case ItemType.clientModuleSchema: {
				route = new KnownRoutes(this.isNetCore).SaveClientUnitSchema;
				break;
			}
			case ItemType.sourceCodeSchema: {
				route = new KnownRoutes(this.isNetCore).SaveSourceCodeSchema;
				break;
			}
			case ItemType.sqlScriptSchema: {
				route = new KnownRoutes(this.isNetCore).SaveSqlSchema;
				break;
			}
			default:{
				throw Error("Unknown schema type");
			}
		}

		const options : IRequestOptions = {
			path: route,
			data: fullSchema
		};
		const response = await this.PostAsync(options);
		const json = JSON.parse(response.body);
		
		if(json['errorInfo']['message']){
			vscode.window.showErrorMessage(json['errorInfo']['message']);
		}

		return json as Object;
	}

	public async GetFeatures(): Promise<Array<IFeature>>{
		const dataServiceRequest  = {
			"rootSchemaName": "AppFeature",
			"columns": {
				"items": {
					"Code": {
						"expression": {
							"columnPath": "Code"
						}
					},
					"State": {
						"expression": {
							"columnPath": "State"
						}
					},
					"StateForCurrentUser": {
						"expression": {
							"columnPath": "StateForCurrentUser"
						}
					},
					"Source": {
						"expression": {
							"columnPath": "Source"
						}
					},
					"Description": {
						"expression": {
							"columnPath": "Description"
						}
					},
					"Id": {
						"expression": {
							"columnPath": "Id"
						}
					}
				}
			}
		};

		const options : IRequestOptions = {
			path: new KnownRoutes(this.isNetCore).SelectQuery,
			data: dataServiceRequest
		};
		const response = await this.PostAsync(options);
		const features = JSON.parse(response.body)['rows'] as Array<IFeature>;
		return features;
	}

	public async GetFeatureById(id: string): Promise<IFeature>{
		const dataServiceRequest  = {
			"rootSchemaName": "AppFeature",
			"filters": {
				"isEnabled": true,
				"trimDateTimeParameterToDate": false,
				"filterType": 1,
				"comparisonType": 3,
				"leftExpression": {
					"expressionType": 0,
					"columnPath": "Id"
				},
				"rightExpression": {
					"expressionType": 2,
					"parameter": {
						"dataValueType": 1,
						"value": `${id}`
					}
				}
			},
			"columns": {
				"items": {
					"Code": {
						"expression": {
							"columnPath": "Code"
						}
					},
					"State": {
						"expression": {
							"columnPath": "State"
						}
					},
					"StateForCurrentUser": {
						"expression": {
							"columnPath": "StateForCurrentUser"
						}
					},
					"Source": {
						"expression": {
							"columnPath": "Source"
						}
					},
					"Description": {
						"expression": {
							"columnPath": "Description"
						}
					},
					"Id": {
						"expression": {
							"columnPath": "Id"
						}
					}
				}
			}
		};

		const options : IRequestOptions = {
			path: new KnownRoutes(this.isNetCore).SelectQuery,
			data: dataServiceRequest
		};
		const response = await this.PostAsync(options);
		const features = JSON.parse(response.body)['rows'] as Array<IFeature>;
		return features[0];
	}


	public async IsClioGateInstalled(): Promise<mySemVer>{
		const dataServiceRequest = {
			rootSchemaName: "SysPackage",
			columns: {
				items: {
					name: {
						expression: {
							columnPath: "Name"
						}
					},
					version: {
						expression: {
							columnPath: "Version"
						}
					},
					id: {
						expression: {
							columnPath: "Id"
						}
					},
					type: {
						expression: {
							columnPath: "Type"
						}
					},

					uId: {
						expression: {
							columnPath: "UId"
						}
					}
				}
			}
		};
		
		const options : IRequestOptions = {
			path: new KnownRoutes(this.isNetCore).SelectQuery,
			data: dataServiceRequest
		};
		const response = await this.PostAsync(options);
		const packages = JSON.parse(response.body)['rows'] as Array<IPackage>;

		var pp = packages.find(p=> p.name ==='cliogate');
		



		if(pp){
			var ver = new mySemVer(pp.version);
			return ver;
		}else{
			return new mySemVer("0.0.0.0");;
		}
	}



	public async SetFeatureState(feature: IFeature): Promise<IFeature>{
		
		const requestData = {
			operationType: 2,
			rootSchemaName: "AppFeature",
			filters: {
				isEnabled: true,
				trimDateTimeParameterToDate: false,
				filterType: 6,
				logicalOperation: 0,
				items: {
					FilterById: {
						isEnabled: true,
						trimDateTimeParameterToDate: false,
						filterType: 1,
						comparisonType: 3,
						leftExpression: {
							expressionType: 0,
							columnPath: "Id"
						},
						rightExpression: {
							expressionType: 2,
							parameter: {
								dataValueType: 1,
								value: feature.Id
							}
						}
					}
				}
			},
			columnValues: {
				items: {
					State: {
						expressionType: 2,
						parameter: {
							dataValueType: 12,
							value: feature.State
						}
					}
				}
			},
			queryKind: 0
		};
		
		
		const options : IRequestOptions = {
			path: new KnownRoutes(this.isNetCore).UpdateQuery,
			data: requestData
		};
		await this.PostAsync(options); //TODO: probably should check for error, standard dataService response
		return await this.GetFeatureById(feature.Id);
	}
	
	public async SetFeatureStateForCurrentUser(feature: IFeature): Promise<IFeature>{
		
		const requestData = {
			operationType: 2,
			rootSchemaName: "AppFeature",
			filters: {
				isEnabled: true,
				trimDateTimeParameterToDate: false,
				filterType: 6,
				logicalOperation: 0,
				items: {
					FilterById: {
						isEnabled: true,
						trimDateTimeParameterToDate: false,
						filterType: 1,
						comparisonType: 3,
						leftExpression: {
							expressionType: 0,
							columnPath: "Id"
						},
						rightExpression: {
							expressionType: 2,
							parameter: {
								dataValueType: 1,
								value: feature.Id
							}
						}
					}
				}
			},
			columnValues: {
				items: {
					StateForCurrentUser: {
						expressionType: 2,
						parameter: {
							dataValueType: 12,
							value: feature.StateForCurrentUser
						}
					}
				}
			},
			queryKind: 0
		};
		
		
		const options : IRequestOptions = {
			path: new KnownRoutes(this.isNetCore).UpdateQuery,
			data: requestData
		};
		await this.PostAsync(options); //TODO: probably should check for error, standard dataService response
		return await this.GetFeatureById(feature.Id);
	}

	public async Listen() : Promise<WebSocket>{
		return new Promise(async (resolve, reject)=>{

			const headers : OutgoingHttpHeaders = {
				"Accept-Encoding":"gzip, deflate, br"
			};

			if(this._credentialsFlow === CredentialsFlow.Form){
				if(this.CookieValues.length === 0){
					await this.Login();
				}
			}else{
				await this.GetTokenAsync();
			}


			const options  = {
				headers: this.setHeaders(headers)
			} as ClientOptions;
	
			const url = this.createWsUrl();
			const ws = new WebSocket(url, options);
			
			ws.on("error",async (error:Error)=>{
				console.log(error.message);
				if(error.message ==='Unexpected server response: 302'){
					console.log("Attempting to login ...");
					//const r = await this.Login();
					if(this._credentialsFlow === CredentialsFlow.Form){
						await this.Login();
					}else{
						await this.GetTokenAsync();
					}
				}
				resolve(await this.Listen());
			});

			const timer = setInterval(()=>{
				if(ws.readyState === WebSocket.OPEN){
					clearInterval(timer);
					resolve(ws);
				}
			},10);
		});
	}

	public async StartLogBroadcast(logLevel: LogLevel, loggerPattern: string) : Promise<void>{
		const options : IRequestOptions = {
			path: new KnownRoutes(this.isNetCore).StartLogBroadcast,
			data: {
				bufferSize: 1,
				logLevelStr: LogLevel[logLevel],
				loggerPattern: loggerPattern
			}
		};
		//await this.PostAsync(options);
		return new Promise((resole, reject)=>{
			const timer = setInterval(async ()=>{
				const response = await this.PostAsync(options);
				if(response.statusCode === 200){
					clearInterval(timer);
					resole();
				}
			},2000);
		});
	}
	
	public async StopLogBroadcast() : Promise<void>{
		const options : IRequestOptions = {
			path: new KnownRoutes(this.isNetCore).StopLogBroadcast,
			data: {}
		};
		await this.PostAsync(options);
	}


	//#region Method : Private
	private async Login() : Promise<IResponse> {
		this.CookieValues = [];
		const postData = {
			UserName:this.username,
			UserPassword: this.password
		};

		const headers : OutgoingHttpHeaders = {
			"Content-Type":"application/json",
			"Accept-Encoding":"gzip, deflate, br",
			"Content-Length": Buffer.byteLength(JSON.stringify(postData), "utf8")
		};

		return await this.execute(
			new KnownRoutes(this.isNetCore).Login,
			HttpMethod.POST, headers, postData);
	}

	private async GetTokenAsync() : Promise<IResponse>{
		const xFormBody = `${encodeURI('grant_type')}=${encodeURI('client_credentials')}&${encodeURI('client_Id')}=${encodeURI(this.Settings.clientId ?? '')}&${encodeURI('client_secret')}=${encodeURI(this.Settings.clientSecret ?? '')}`;
		const token =  await this.executeToken(new KnownRoutes(this.isNetCore).Token, HttpMethod.POST, xFormBody);
		
		this.oauthToken = JSON.parse(token.body) as ITokenModel;
		
		const now = new Date();
		this.oauthToken.issuedAt = new Date();
		this.oauthToken.expiresAt = now;

		const addSeconds = now.getSeconds() + this.oauthToken.expires_in - 5*60;
		this.oauthToken.expiresAt.setSeconds(addSeconds);
		return token;
	}

	private async executeToken(path: string, method: HttpMethod, data: string) : Promise<IResponse>{
		return new Promise<IResponse>((resolve, reject)=>{
			const options = {
				host: this.Settings.oauthUrl?.hostname,
				path: this._pathName+path,
				port: this.Settings.oauthUrl?.port,
				method: HttpMethod[method],
				headers: {
					"Content-Type" :"application/x-www-form-urlencoded",
					"Accept-Encoding":"gzip, deflate, br",
					"Content-Length": Buffer.byteLength(data, "utf8")
				}
			} as RequestOptions;

			var chunks : Array<any> = [];
			const callBack = (res : IncomingMessage) => {
				//res.setEncoding('utf8');
				res.on("data", (chunk: string) => {
					if(res.statusCode !== 401 && res.statusCode !== 403){
						this.getCookies(res);
						chunks.push(chunk);
					} else if (res.statusCode === 401 || res.statusCode === 403){
						this.CookieValues = new Array<{key: string, value:string}>();
						resolve({
							body: chunk.toString(), 
							statusCode: res.statusCode
						} as IResponse);
					}
				});

				res.on("end", ()=>{
					resolve({
						body: Buffer.concat(chunks).toString(),
						statusCode: res.statusCode
					} as IResponse);
				});

				res.on("error", (error) =>{
					resolve({
						body: error.message, 
						statusCode: res.statusCode
					} as IResponse);
				});
			};

			const request : ClientRequest = this.resolveClient(options, callBack);
			if(data){
				request.write(data);
			}
			request.end();
			
			request.on("error",(error)=>{
				resolve({
					body : error.message,
					statusCode: (error as any).errno as unknown as number
				} as IResponse);
			});
		});
	}

	private async execute(path: string, method: HttpMethod, headers?: OutgoingHttpHeaders, data?: any) : Promise<IResponse>{
		return new Promise<IResponse>((resolve, reject)=>{
			const options = {
				host: this.url.hostname,
				path: this._pathName+path,
				port: this.url.port,
				method: HttpMethod[method],
				headers: this.setHeaders(headers)
			} as RequestOptions;

			var chunks : Array<any> = [];
			const callBack = (res : IncomingMessage) => {
				//res.setEncoding('utf8');
				res.on("data", (chunk: string) => {
					if(res.statusCode !== 401 && res.statusCode !== 403){
						this.getCookies(res);
						chunks.push(chunk);
					} else if (res.statusCode === 401 || res.statusCode === 403){
						this.CookieValues = new Array<{key: string, value:string}>();
						resolve({
							body: chunk.toString(), 
							statusCode: res.statusCode
						} as IResponse);
					}
				});

				res.on("end", ()=>{
					resolve({
						body: Buffer.concat(chunks).toString(),
						statusCode: res.statusCode
					} as IResponse);
				});

				res.on("error", (error) =>{
					resolve({
						body: error.message, 
						statusCode: res.statusCode
					} as IResponse);
				});
			};

			const request : ClientRequest = this.resolveClient(options, callBack);
			if(data){
				request.write(JSON.stringify(data));
			}
			request.end();
			
			request.on("error",(error)=>{
				resolve({
					body : error.message,
					statusCode: (error as any).errno as unknown as number
				} as IResponse);
			});
		});
	}

	private getCookies(msg: IncomingMessage): void{
		const cookies = msg.headers["set-cookie"];
		cookies?.forEach(cookie => {
			const segments:Array<string> = cookie.split(";");
			if(segments){
				const kvp = (segments: Array<string>) => {
					const t = segments[0].split("=");
					const tt :{key: string, value:string} = {
						key: t[0],
						value: t[1]
					};
					return tt;
				};

				let key = this.CookieValues.find(c=>{
					return c.key === kvp(segments).key;
				});
				if(!key){
					this.CookieValues.push(kvp(segments));
				}

			}
		});
	}

	private setHeaders(headers?: OutgoingHttpHeaders): OutgoingHttpHeaders | undefined{	
		
		if(this._credentialsFlow === CredentialsFlow.OAuth){
			const h = headers as unknown as {[key: string]: any};
			h.Authorization = `${this.oauthToken?.token_type} ${this.oauthToken?.access_token}`;
			return h as unknown as OutgoingHttpHeaders;
		}

		if(this.CookieValues.length>0 && this._credentialsFlow === CredentialsFlow.Form){
			const h = headers as unknown as {[key: string]: any};

			const bpmcsrf = this.CookieValues.find((x)=>{
				return x.key === "BPMCSRF";
			});
			if(bpmcsrf?.value){
				h.BPMCSRF = bpmcsrf?.value;
			}
			let str = "";
			this.CookieValues.forEach(cookie=>{
				str+= `${cookie.key}=${cookie.value};`;
			});
			
			if(str!==""){
				h.Cookie = str;
			}
			return h as unknown as OutgoingHttpHeaders;
		}
		return headers;
	}

	private resolveClient(options: RequestOptions, callBack?: (res : IncomingMessage)=>void): ClientRequest {

		if(this.url.protocol === "http:") {
			return httpRequest(options, callBack);
		} 
		else if (this.url.protocol === "https:") {
			return httpsRequest(options, callBack);
		}
		else {
			throw new Error('Supported protocols either http or https');
		}
	}

	private createWsUrl() : URL{
		let protocol : string = (this.url.protocol === "http:")? 'ws://': 'wss://';
		return new URL(protocol+this.url.host+this._pathName + new KnownRoutes(this.isNetCore).WebSocket);
	}

	/**
	 * Parses BusinessProcessSchema 
	 * @param json Input from GetProcessSchema()
	 * @returns Parsed ProcessSchema
	 */
	 private async ParseProcessSchema(json: any): Promise<IProcessSchema>{
		let innerMetadata = JSON.parse(json['schema']['metaData']);

		//Bidirectional params do not have default value, overwrite default of 0
		for(let i in innerMetadata['metaData']['schema']['parameters'] as any[]){
			let param = innerMetadata['metaData']['schema']['parameters'][i];

			if(param['direction'] === undefined){
				param['direction'] = 2;
			}
		}
		
		//Inner metadata is hidden in string
		let schema = json.schema as IProcessSchema;
		
		//useBackgroundMode is set in staring element, but we only care about SimpleStart
		schema.innerMetadata = innerMetadata['metaData'];
		let startElement = schema.innerMetadata.schema.flowElements.find(el=> el.typeName ==='Terrasoft.Core.Process.ProcessSchemaStartEvent');
		if(startElement){
			if(startElement.useBackgroundMode){
				schema.useBackgroundMode = startElement.useBackgroundMode;
			}
		}

		//Convert GUID DataValueType to DataValueType enum
		schema.innerMetadata.schema.parameters.forEach(el =>{
			 const propName = (el.dataValueType as any);
			 const value = (ProcessDataValueType as any)[propName];
			 el.dataValueType = value;

			const resourceName = `Parameters.${el.name}.Caption`;
			const caption = (schema.resources as any)[resourceName];
			el.caption = caption;
		});
		return schema;
	}
	//#endregion
}

export interface IFeature {
	Code: string,
	State: boolean,
	StateForCurrentUser: boolean
	Source: string
	Description: string,
	Id: string
}


export interface IPackages extends IResponse{
	packages : Array<IPackage>
}
export interface IPackage{
	createdBy: string,
	createdOn: Date,
	description: string,
	id: string,
	isReadOnly: boolean,
	maintainer: string,
	modifiedBy: string,
	modifiedOn: Date,
	name: string
	position: number,
	type: number,
	uId: string,
	version: string
}

export interface IProcessList extends IResponse {
	processes: Array<IBusinessProcess>;
}


export interface IBusinessProcess{
	Id: string;
	Caption: string;
	TagProperty: string;
	SysSchemaId: string;
	Enabled: boolean;
	Name: string;
	Parent: string;
	ProcessSchemaType: {
		value: string;
		displayValue: string;
		primaryImageValue: string
	};
	StartOptionsImage:{
		value: string;
		displayValue: string;
		primaryImageValue: string
	}
}

export interface IProcessParameter {
	dataValueType: DataValueType,
	typeName: string
	direction?: ParameterDirection
	name: string
	uId: string
	caption: any
}

export interface IProcessSchema  extends IResponse{
	metaData:any
	resources: string
	parentSchemaUId: string
	lazyProperties: string[]
	loadedLazyProperties: string[]
	uId: string
	realUId: string
	name: string
	caption: any
	description: any
	extendParent: boolean
	packageUId: string
	innerMetadata: {
		schema:{
			flowElements: {
				typeName: string,
				useBackgroundMode?: boolean
			}[],
			parameters: IProcessParameter[]
		}
	}
	useBackgroundMode: boolean
}

export interface IEntitySchemaManagerRequest extends IResponse{
	collection : Array<IEntitySchemaManagerItem>
}

export interface IEntitySchemaManagerItem{
	isVirtual: boolean,
	id: string,
	name: string,
	caption: string,
	uId: string
	packageUId: string
	parentUId: string
	extendParent: boolean
}

export interface SchemaDefinition {
	parentUId: string;
	isVirtual: boolean;
	isDBView: boolean;
	isTrackChangesInDB: boolean;
	administratedByOperations: boolean;
	administratedByColumns: boolean;
	administratedByRecords: boolean;
	useMasterRecordRights: boolean;
	masterRecordSchemaName: string;

	columns: Array<EntitySchemaColumn>;
	primaryColumnUId: string;
	primaryDisplayColumnUId: string;
	uId: string;
	realUId: string;
	name: string;
	caption: any;
	description: any;
	extendParent: boolean
}

export interface EntitySchemaColumn  {
	uId: string
	name: string
	referenceSchemaName?:string
	caption:any
	description: string 
	dataValueType: number
	isInherited: boolean
	isOverride: boolean
	referenceSchemaUId? : string
	isRequired: boolean
	isVirtual: boolean
	isValueCloneable: boolean
	isMultilineText: boolean
	isSimpleLookup : boolean
	isCascade : ColumnUsage,
	usageType: number
	status: number
	isIndexed: boolean
	isWeakReference: boolean
}

export interface IWorkSpaceItem{
	id: string,
	isChanged: boolean,
	isLocked: boolean,
	isReadOnly: boolean,
	modifiedOn: Date,
	name: string,
	packageName: string,
	packageRepository: string | undefined,
	packageUId: string
	title: string | undefined,
	type: number,
	uId: string
}


export interface IWebSocketMessage{
	Id: string,
	Header:{
		Sender: string
		BodyTypeName: string|undefined
	},
	Body: string|undefined
}