import { IncomingMessage, OutgoingHttpHeaders } from "http";
import { request as httpsRequest, RequestOptions} from "https";
import { SemVer } from "semver";
import { HttpMethod } from '../Enums';
import { IRequestOptions, IResponse } from '../interfaces';
import { CompatiblePlatform, DbmsCompatibility, MarketplaceApp, ModerationState, ProductCategory } from './marketplaceApp';

export class MarketplaceClient{

	private readonly _url: URL = new URL('https://marketplace.creatio.com');

	/**
	 *
	 */
	constructor() {}


	/**
	 * Returns compatible platform
	 * @param id App Id
	 * @param vid Version Id
	 * @returns Platform (.net core, .net Framework)
	 */
	public async GetAppCompatibilityPlatformAsync(id: string, vid: number): Promise<CompatiblePlatform[]>{
		//field_app_language
		const options : IRequestOptions = {
			path: `/jsonapi/node/application/${id}/field_compatibility_platform`,
			query:[
				{key: "resourceVersion", value: `id:${vid}`},
				{key: "fields[taxonomy_term--product_platform]", value: "name"}
			]
		};
		const response : IResponse= await this.GetAsync(options);
		const data = JSON.parse(response.body)['data'] as Array<any>;
		const returnData : CompatiblePlatform[] = [];
		data.forEach(element=>{
			if(element['attributes'] && element['attributes']['name']){
				
				switch(element['attributes']['name']){
					case ".Net Core":
						returnData.push(CompatiblePlatform.NetCore);
						break;
					case ".Net Framework":
						returnData.push(CompatiblePlatform.NetFramework);
						break;
					default:
						returnData.push(CompatiblePlatform.Unknown);
						break;
				}
			}else{
				returnData.push(CompatiblePlatform.Unknown);
			}
		});
		return returnData;
	}

	public async GetAppCompatibilityDbmsAsync(id: string, vid: number): Promise<DbmsCompatibility[]>{
		//field_app_language
		const options : IRequestOptions = {
			path: `/jsonapi/node/application/${id}/field_compatibility_dbms`,
			query:[
				{key: "resourceVersion", value: `id:${vid}`},
				{key: "fields[taxonomy_term--dbms]", value: "name"}
			]
		};
		const response : IResponse= await this.GetAsync(options);
		const data = JSON.parse(response.body)['data'] as Array<any>;
		const returnData : DbmsCompatibility[] = [];
		data.forEach(element=>{
			if(element['attributes'] && element['attributes']['name']){
				switch (element['attributes']['name']){
					case "Any supported DBMS":
						returnData.push(DbmsCompatibility.All);
						break;
					case "MS SQL":
						returnData.push(DbmsCompatibility.MsSql);
						break;
					case "Oracle":
						returnData.push(DbmsCompatibility.Oracle);
						break;
					case "PostgreSQL":
						returnData.push(DbmsCompatibility.PgSql);
						break;
					default:
						returnData.push(DbmsCompatibility.Unknown);
						break;
				}
			}else{
				returnData.push(DbmsCompatibility.Unknown);
			}
		});
		return returnData;
	}


	public async GetAppLanguageAsync(id: string, vid: number): Promise<string[]>{
		//field_app_language
		const options : IRequestOptions = {
			path: `/jsonapi/node/application/${id}/field_app_language`,
			query:[
				{key: "resourceVersion", value: `id:${vid}`},
				{key: "fields[taxonomy_term--language]", value: "name"}
			]
		};
		const response : IResponse= await this.GetAsync(options);
		const data = JSON.parse(response.body)['data'] as Array<any>;
		const returnData : string[] = [];
		data.forEach(element=>{
			if(element['attributes'] && element['attributes']['name']){
				returnData.push(element['attributes']['name']);
			}
		});
		return returnData;
	}


	/**
	 * Gets lowest semantic version of a compatible creatio app. Assume that the higher version will always support lower
	 * @param id Application Id
	 * @param vid Resource Version
	 * @returns Semantic version {@link https://github.com/npm/node-semver#readme | See SemVer Documentation}
	 */
	public async GetAppCompatibilityVersionAsync(id: string, vid: number): Promise<SemVer>{
		const options : IRequestOptions = {
			path: `/jsonapi/node/application/${id}/field_app_compatibility_version`,
			query:[
				{key: "resourceVersion", value: `id:${vid}`},
				{key: "fields[taxonomy_term--product_version]", value: "name"}
			]
		};
		const response : IResponse= await this.GetAsync(options);
		const jData = JSON.parse(response.body);
		if(jData['data'] !== null && jData['data']['attributes']['name']){
			
			const _v = jData['data']['attributes']['name'] as string;
			if(_v && _v!== "- None -"){
				const _vv = _v.split(" ")[0].trim();
				const parts = _vv.split('.');
				
				if(parts.length === 1){
					const _temp = `${parts[0].trim()}.0.0`;
					return new SemVer(_temp);
				} else if(parts.length === 2){
					const _temp = `${parts[0].trim()}.${parts[1].trim()}.0`;
					return new SemVer(_temp);
				}else if(parts.length === 2){
					const _temp = `${parts[0].trim()}.${parts[1].trim()}.${parts[2].trim()}`;
					return new SemVer(_temp);
				}else{
					return new SemVer("0.0.0");
				}
			}else{
				return new SemVer("0.0.0");
			}
		}else{
			return new SemVer("0.0.0");
		}
	}

	public async GetAppCompatibilityAsync(id: string, vid: number): Promise<string[]>{
		const options : IRequestOptions = {
			path: `/jsonapi/node/application/${id}/field_app_compatibility`,
			query:[
				{key: "resourceVersion", value: `id:${vid}`},
				{key: "fields[taxonomy_term--products]", value: "name"}
			]
		};
		const response : IResponse= await this.GetAsync(options);
		const data = JSON.parse(response.body)['data'] as Array<any>;
		const returnData : string[] = [];
		data.forEach(element=>{
			if(element['attributes'] && element['attributes']['name']){
				returnData.push(element['attributes']['name']);
			}
		});
		return returnData;
	}

	public async GetAppProductCategoryAsync(id: string, vid: number): Promise<ProductCategory>{
		const options : IRequestOptions = {
			path: `/jsonapi/node/application/${id}/field_app_product_category`,
			query:[
				{key: "resourceVersion", value: `id:${vid}`},
				{key: "fields[taxonomy_term--product_category]", value: "name"}
			]
		};
		const response : IResponse= await this.GetAsync(options);
		const jData =JSON.parse(response.body);
		//Connector || Software solution
		if(jData['data'] !== null && jData['data']['attributes']['name']) {
			const _temp = jData['data']['attributes']['name'] as string;
			switch(_temp){
				case "Connector":
					return ProductCategory.Connector;
				case "Software solution":
					return ProductCategory.SoftwareSolution;
				case "Add-on":
					return ProductCategory.AddOn;
				default: 
					return ProductCategory.Unknown;
			}
		}else{
			return ProductCategory.Unknown;
		}
	}
	public async GetDeveloperAsync(id: string, vid: number): Promise<string | undefined>{
		const options : IRequestOptions = {
			path: `/jsonapi/node/application/${id}/field_developer`,
			query:[
				{key: "resourceVersion", value: `id:${vid}`},
				{key: "fields[node--company]", value: "title"}
			]
		};
		const response : IResponse= await this.GetAsync(options);
		const jData =JSON.parse(response.body);
		if(jData['data'] !== null && jData['data']['attributes']['title']) {
			return jData['data']['attributes']['title'];
		}
	}

	public async GetFieldApplicationMapAsync(id: string, vid: number) : Promise<string[]>{
		const options : IRequestOptions = {
			path: `/jsonapi/node/application/${id}/field_application_map`,
			query:[
				{key: "resourceVersion", value: `id:${vid}`},
				{key: "fields[taxonomy_term--application_map]", value: "name"}
			]
		};
		const response : IResponse= await this.GetAsync(options);
		const data = JSON.parse(response.body)['data'] as Array<any>;
		const returnData : string[] = [];
		data.forEach(element=>{
			if(element['attributes'] && element['attributes']['name']){
				returnData.push(element['attributes']['name']);
			}
		});
		return returnData;
	}

	public async GetCatalogueAsync() : Promise<MarketplaceApp[]>{

		const returnData : Array<MarketplaceApp> = [];
		let offset : number = 0;
		let isDone : boolean = false;
		const data : Array<any> = [];

		do {
			const options : IRequestOptions = {
				path: '/jsonapi/node/application',
				query: [
					{key: 'page[limit]', value:50},
					{key: 'page[offset]', value:offset},
					{key: 'filter[created-filter][condition][path]', value:'created'},
					{key: 'filter[created-filter][condition][operator]', value:'>='},
					{key: 'filter[created-filter][condition][value]', value:0},
					{key: 'fields[node--application]', value:'title,moderation_state,drupal_internal__vid,drupal_internal__nid,field_app_short_description,path,field_app_certificate'}
				]
			};
	
			console.log(`Executing request: ${offset}`);
			const response : IResponse= await this.GetAsync(options);
			const _requestData : Array<any> = JSON.parse(response.body)['data'];
			isDone = _requestData.length < 50 ? true:false;
			offset +=50;
			data.push(..._requestData);
		} while (!isDone);
		
		data.forEach(element=>{
			const _id = element['id'] as string;
			const _nid: number = element['attributes']['drupal_internal__nid'] as number;
			const _vid: number = element['attributes']['drupal_internal__vid'] as number;
			const _title: string = element['attributes']['title'] as string;
			const _moderationState: ModerationState = element['attributes']['moderation_state'] === 'published' ? ModerationState.published : ModerationState.upcoming;
			const _shortDescription: string = element['attributes']['field_app_short_description']['processed'] as string;
			const _path: string = element['attributes']['path']['alias'] as string;
			const _isCertified: boolean = element['attributes']['field_app_certificate'] as boolean;
			const app = new MarketplaceApp(_id, _nid, _vid, _title, _moderationState, _shortDescription, _path, _isCertified);
			returnData.push(app);
		});
		return returnData;
	}

	//#region Private
	private async GetAsync(options: IRequestOptions): Promise<IResponse>{
		const headers : OutgoingHttpHeaders = {
			"Accept-Encoding":"gzip, deflate, br",
			"Content-Type": "application/vnd.api+json"
		};

		if(options.query){
			let queryString = '?';
			options.query.forEach((kvp,index)=>{
				if(index === 0){
					queryString+=`${kvp.key}=${kvp.value}`;
				}else{
					queryString+=`&${kvp.key}=${kvp.value}`;
				}
			});
			options.path+=queryString;
		}
		return this.ExecuteAsync(options.path, HttpMethod.GET, headers);
	}

	private async ExecuteAsync(path: string, method: HttpMethod, headers?: OutgoingHttpHeaders, data?: any) : Promise<IResponse>{
		return new Promise<IResponse>((resolve, reject)=>{
			const options = {
				host: this._url.hostname,
				path: path,
				port: this._url.port,
				method: HttpMethod[method],
			} as RequestOptions;

			var chunks : Array<any> = [];
			const callBack = (res : IncomingMessage) => {
				//res.setEncoding('utf8');
				res.on("data", (chunk: string) => {
					if(res.statusCode !== 401 && res.statusCode !== 403){
						chunks.push(chunk);
					} else if (res.statusCode === 401 || res.statusCode === 403){
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
					reject({
						body: error.message, 
						statusCode: res.statusCode
					} as IResponse);
				});
			};

			const request = httpsRequest(options, callBack);
			if(data){
				request.write(JSON.stringify(data));
			}
			request.end();
			
			request.on("error",(error)=>{
				reject({
					body : error.message,
					statusCode: (error as any).errno as unknown as number
				} as IResponse);
			});
		});
	}
	//#endregion
}