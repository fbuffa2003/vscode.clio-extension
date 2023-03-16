import { ClientRequest, IncomingMessage, OutgoingHttpHeaders } from "http";
import { RequestOptions } from "https";
import { request as httpRequest } from "http";
import { request as httpsRequest} from "https";
import { IRequestOptions, IResponse } from "../Interfaces";
import { HttpMethod } from "../Enums";
import { isArrayBufferView } from "util/types";

export class NugetClient {
	
	private _indexUrl : URL;
	private readonly _searchQueryService: IService[] = [];

	constructor() {
		this._indexUrl = new URL("https://api.nuget.org");
	}

	/**
	 * The service index is a JSON document that is the entry point for a NuGet package source 
	 * and allows a client implementation to discover the package source's capabilities. 
	 * The service index is a JSON object with two required properties: 
	 * version (the schema version of the service index) and resources (the endpoints or capabilities of the package source).
	 * nuget.org's service index is located at https://api.nuget.org/v3/index.json.
	 * See {@link https://learn.microsoft.com/en-us/nuget/api/service-index service index} for more details
	 */
	public async getServiceIndex() : Promise<void>{
		const options : IRequestOptions = {
			path: "/v3/index.json"
		};
		const response =  await this.getAsync(options, this._indexUrl);

		if(response.statusCode === 200){
			const serviceIndex = JSON.parse(response.body) as IIndexResponse;

			const _sqs = serviceIndex.resources.find(resource=> resource["@type"] === "SearchQueryService");
			if(_sqs){
				this._searchQueryService?.push(_sqs as IService);
			}
		}
	}

	public async searchClioHighestVersion(): Promise<string>{

		if(this._searchQueryService && this._searchQueryService[0]){
			const options : IRequestOptions = {
				path: new URL(this._searchQueryService[0]["@id"]).pathname+"?q=clio&packagetype=dotnettool&prerelease=false"
			};
			const response = await this.getAsync(options, new URL(this._searchQueryService[0]["@id"]));
			if (response.statusCode ===200){
				return JSON.parse(response.body)['data'][0]['version'];
			}
		}
		return '';
	}


	public async getAsync(options: IRequestOptions, baseUrl?: URL): Promise<IResponse>{
		const headers : OutgoingHttpHeaders = {
			"Accept-Encoding":"gzip, deflate, br",
		};
		return await this.execute(options.path, HttpMethod.GET, headers, undefined ,baseUrl);
	}

	public async postAsync(options: IRequestOptions,baseUrl?: URL): Promise<IResponse>{
		const headers : OutgoingHttpHeaders = {
			"Content-Type":"application/json",
			"Accept-Encoding":"gzip, deflate, br",
			"Content-Length": Buffer.byteLength(JSON.stringify(options.data), "utf8")
		};
		return await this.execute(options.path, HttpMethod.POST, headers, options.data, baseUrl);
	}
	
	private async execute(path: string, method: HttpMethod, headers?: OutgoingHttpHeaders, data?: any, baseUrl?: URL) : Promise<IResponse>{
		return new Promise<IResponse>((resolve, reject)=>{
			const options = {
				host: baseUrl?.hostname,
				path: path,
				port: 443,
				method: HttpMethod[method],
			} as RequestOptions;

			var chunks : Array<any> = [];
			const callBack = (res : IncomingMessage) => {
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
					resolve({
						body: error.message, 
						statusCode: res.statusCode
					} as IResponse);
				});
			};

			
			const request : ClientRequest = httpsRequest(options, callBack);;
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
}




export interface IIndexResponse{
	version: string,
	resources: Array<IService>
}

export interface IService{
	/**
	 * The URL to the resource
	 */
	"@id": string,

	/**
	 * A string constant representing the resource type
	 * {RESOURCE_NAME}/{RESOURCE_VERSION}
	 */
	"@type": string

	/**
	 * A human readable description of the resource
	 */
	comment?: string
}