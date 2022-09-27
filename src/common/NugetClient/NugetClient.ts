import { ClientRequest, IncomingMessage, OutgoingHttpHeaders } from "http";
import { RequestOptions } from "https";
import { request as httpRequest } from "http";
import { request as httpsRequest} from "https";
import { IRequestOptions, IResponse } from "../interfaces";
import { HttpMethod } from "../Enums";

export class NugetClient {
	
	constructor(
			public url: URL,
			public username: string,
			public password: string,
			public isNetCore: boolean
		) {}

	public async getAsync(options: IRequestOptions): Promise<IResponse>{

		const headers : OutgoingHttpHeaders = {
			"Accept-Encoding":"gzip, deflate, br",
		};

		const firstRequest =  await this.execute(
			options.path,
			HttpMethod.GET, headers);
		if(firstRequest.statusCode === 401){
			const result =  await this.execute(
				options.path,
				HttpMethod.GET, headers);
			return result;
		} else {
			return firstRequest;
		}
	}

	public async postAsync(options: IRequestOptions): Promise<IResponse>{
		const headers : OutgoingHttpHeaders = {
			"Content-Type":"application/json",
			"Accept-Encoding":"gzip, deflate, br",
			"Content-Length": Buffer.byteLength(JSON.stringify(options.data), "utf8")
		};
		const firstRequest =  await this.execute(options.path, HttpMethod.POST, headers, options.data);
		if(firstRequest.statusCode === 401 || firstRequest.statusCode === 403){
			return this.execute(options.path, HttpMethod.POST, headers, options.data);
		} else {
			return firstRequest;
		}
	}
	
	private async execute(path: string, method: HttpMethod, headers?: OutgoingHttpHeaders, data?: any) : Promise<IResponse>{
		return new Promise<IResponse>((resolve, reject)=>{
			const options = {
				host: this.url.hostname,
				path: path,
				port: this.url.port,
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
}
