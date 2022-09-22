
export class KnownRoutes {

	/**
	 * - /ServiceModel/AuthService.svc/Login
	 */
	public Login: string = "/ServiceModel/AuthService.svc/Login";


	private _Logout: string = "/rest/MainMenuService/Logout";
	/**
	 * - /rest/MainMenuService/Logout
	 */
	public get Logout(): string {
		return this.getRoute(this._Logout);
	}
	private set Logout(v: string) {
		this._Logout = v;
	}



	private _GetCurrentUserInfo: string = "/ServiceModel/UserInfoService.svc/getCurrentUserInfo";
	/**
	 * - /ServiceModel/UserInfoService.svc/getCurrentUserInfo
	 */
	public get GetCurrentUserInfo(): string {
		return this.getRoute(this._GetCurrentUserInfo);
	}
	private set GetCurrentUserInfo(v: string) {
		this._GetCurrentUserInfo = v;
	}


	private _SelectQuery: string = "/DataService/json/SyncReply/SelectQuery";
	/**
	 * /DataService/json/SyncReply/SelectQuery
	 */
	public get SelectQuery(): string {
		return this.getRoute(this._SelectQuery);
	}
	private set SelectQuery(v: string) {
		this._SelectQuery = v;
	}

	private _InsertQuery: string = "/DataService/json/SyncReply/InsertQuery";
	/**
	 * - /DataService/json/SyncReply/InsertQuery
	 */
	public get InsertQuery(): string {
		return this.getRoute(this._InsertQuery);
	}
	private set InsertQuery(v: string) {
		this._InsertQuery = v;
	}

	private _DeleteQuery: string = "/DataService/json/SyncReply/DeleteQuery";
	/**
	 * - /DataService/json/SyncReply/DeleteQuery
	 */
	public get DeleteQuery(): string {
		return this.getRoute(this._DeleteQuery);
	}
	private set DeleteQuery(v: string) {
		this._DeleteQuery = v;
	}

	private _UpdateQuery: string = "/DataService/json/SyncReply/UpdateQuery";
	/**
	 * - /DataService/json/SyncReply/UpdateQuery
	 */
	public get UpdateQuery(): string {
		return this.getRoute(this._UpdateQuery);
	}
	private set UpdateQuery(v: string) {
		this._UpdateQuery = v;
	}



	private _RunProcess: string = "/ServiceModel/ProcessEngineService.svc/RunProcess";
	/**
	 * - /ServiceModel/ProcessEngineService.svc/RunProcess
	 */
	public get RunProcess(): string {
		return this.getRoute(this._RunProcess);
	}
	private set RunProcess(v: string) {
		this._RunProcess = v;
	}

	private _ProcessSchemaRequest: string = "/DataService/json/SyncReply/ProcessSchemaRequest";
	/**
	 * - /DataService/json/SyncReply/ProcessSchemaRequest
	 */
	public get ProcessSchemaRequest(): string {
		return this.getRoute(this._ProcessSchemaRequest);
	}
	private set ProcessSchemaRequest(v: string) {
		this._ProcessSchemaRequest = v;
	}


	private _ProcessSchemaParameter: string = "/DataService/json/SyncReply/ProcessSchemaParameter";

	/**
	 * - /DataService/json/SyncReply/ProcessSchemaParameter
	 */
	public get ProcessSchemaParameter(): string {
		return this.getRoute(this._ProcessSchemaParameter);
	}
	private set ProcessSchemaParameter(v: string) {
		this._ProcessSchemaParameter = v;
	}



	private _RuntimeEntitySchemaRequest: string = "/DataService/json/SyncReply/RuntimeEntitySchemaRequest";
	/**
	 * - /DataService/json/SyncReply/RuntimeEntitySchemaRequest
	 */
	public get RuntimeEntitySchemaRequest(): string {
		return this.getRoute(this._RuntimeEntitySchemaRequest);
	}
	private set RuntimeEntitySchemaRequest(v: string) {
		this._RuntimeEntitySchemaRequest = v;
	}


	private _EntitySchemaManagerRequest : string = "/DataService/json/SyncReply/EntitySchemaManagerRequest";
	/**
	 * - /DataService/json/SyncReply/EntitySchemaManagerRequest
	 */
	public get EntitySchemaManagerRequest() : string {
		return this.getRoute(this._EntitySchemaManagerRequest);
	}
	private set EntitySchemaManagerRequest(v : string) {
		this._EntitySchemaManagerRequest = v;
	}


	
	private _RestartApp : string = "/ServiceModel/AppInstallerService.svc/RestartApp";
	/**
	 * - /ServiceModel/AppInstallerService.svc/RestartApp
	 */
	public get RestartApp() : string {

		if(this.isNetCore){
			return "/ServiceModel/AppInstallerService.svc/RestartApp";
		}else{
			return "/0/ServiceModel/AppInstallerService.svc/UnloadAppDomain";
		}	
	}
	private set RestartApp(v : string) {
		this._RestartApp = v;
	}
	

	
	private _ClearRedisDb : string = "/ServiceModel/AppInstallerService.svc/ClearRedisDb";
	/**
	 * - /ServiceModel/AppInstallerService.svc/ClearRedisDb
	 */
	public get ClearRedisDb() : string {
		return this.getRoute(this._ClearRedisDb);
	}
	private set ClearRedisDb(v : string) {
		this._ClearRedisDb = v;
	}
	
	
	private _ExecuteSqlScript : string = "/rest/CreatioApiGateway/ExecuteSqlScript";
	/**
	 * - /rest/CreatioApiGateway/ExecuteSqlScript
	 */
	public get ExecuteSqlScript() : string {
		return this.getRoute(this._ExecuteSqlScript);
	}
	private set ExecuteSqlScript(v : string) {
		this._ExecuteSqlScript = v;
	}
	

	/**
	 *
	 * @param isNetCore Indicates if routes are for netcore app
	 */
	constructor(public isNetCore: boolean) {
	}

	private getRoute(route: string): string {
		if (this.isNetCore) {
			return route;
		} else {
			return "/0" + route;
		}
	}
}
