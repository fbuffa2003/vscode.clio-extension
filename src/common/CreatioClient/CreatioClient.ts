import { ClientRequest, IncomingMessage, OutgoingHttpHeaders } from "http";
import { RequestOptions } from "https";
import { request as httpRequest } from "http";
import { request as httpsRequest} from "https";
import { ColumnUsage, DataValueType, HttpMethod, ParameterDirection, ProcessDataValueType } from "./enums";
import { KnownRoutes } from "./KnownRoutes";

export class CreatioClient {

	private CookieValues : Array<{key: string, value:string}> = new Array<{key: string, value:string}>();

	constructor(
			public url: URL,
			public username: string,
			public password: string,
			public isNetCore: boolean
		) {}

	public async GetAsync(options: IRequestOptions): Promise<IResponse>{
		
		if(this.CookieValues.length === 0){
			await this.Login();
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
		
		if(this.CookieValues.length === 0){
			await this.Login();
		}
		const headers : OutgoingHttpHeaders = {
			"Content-Type":"application/json",
			"Accept-Encoding":"gzip, deflate, br",
			"Content-Length": Buffer.byteLength(JSON.stringify(options.data), "utf8")
		};
		const firstRequest =  await this.execute(options.path, HttpMethod.POST, headers, options.data);
		if(firstRequest.statusCode === 401 || firstRequest.statusCode === 403){
			await this.Login();
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

	private async execute(path: string, method: HttpMethod, headers?: OutgoingHttpHeaders, data?: any) : Promise<IResponse>{
		
		return new Promise<IResponse>((resolve, reject)=>{
			const options = {
				host: this.url.hostname,
				path: path,
				port: this.url.port,
				method: HttpMethod[method],
				headers: this.setCookies(headers)
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

	private setCookies(headers?: OutgoingHttpHeaders): OutgoingHttpHeaders | undefined{	
		if(this.CookieValues.length>0){
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
				schema.useBackgroundMode = startElement.useBackgroundMode
			}
		}

		//Convert GUID DataValueType to DataValueType enum
		schema.innerMetadata.schema.parameters.forEach(el =>{
			 let propName = (el.dataValueType as any);
			 let value = (ProcessDataValueType as any)[propName]
			 el.dataValueType = value;

			let resourceName = `Parameters.${el.name}.Caption`;
			let caption = (schema.resources as any)[resourceName];
			el.caption = caption;
		});
		return schema
	}
	//#endregion
}



export interface IProcessList extends IResponse {
	processes: Array<IBusinessProcess>;
}

export interface IResponse{
	body: string,
	statusCode?: number
}

export interface IRequestOptions{
	path: string,
	data?: any
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