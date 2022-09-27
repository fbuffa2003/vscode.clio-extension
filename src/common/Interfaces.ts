
export interface IResponse {
	body: string,
	statusCode?: number
}

export interface IRequestOptions {
	path: string,
	data?: any
}