export enum HealthStatus {
	unknown =0,
	healthy = 1,
	unHealthy = 2
}

/**
 * See {@link https://www.w3schools.com/tags/ref_httpmethods.asp  HTTP Request Methods}
 */
 export enum HttpMethod{
	GET,
	POST,
	PUT,
	HEAD,
	DELETE,
	PATCH,
	OPTIONS,
	CONNECT,
	TRACE
}