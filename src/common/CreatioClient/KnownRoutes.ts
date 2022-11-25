
export class KnownRoutes {

	/**
	 * - /ServiceModel/AuthService.svc/Login
	 */
	public Login: string = "/ServiceModel/AuthService.svc/Login";
	public Token: string = "/connect/token";
	

	private _logout: string = "/rest/MainMenuService/Logout";
	/**
	 * - /rest/MainMenuService/Logout
	 */
	public get Logout(): string {
		return this.getRoute(this._logout);
	}
	private set Logout(v: string) {
		this._logout = v;
	}



	private _getCurrentUserInfo: string = "/ServiceModel/UserInfoService.svc/getCurrentUserInfo";
	/**
	 * - /ServiceModel/UserInfoService.svc/getCurrentUserInfo
	 */
	public get GetCurrentUserInfo(): string {
		return this.getRoute(this._getCurrentUserInfo);
	}
	private set GetCurrentUserInfo(v: string) {
		this._getCurrentUserInfo = v;
	}


	private _selectQuery: string = "/DataService/json/SyncReply/SelectQuery";
	/**
	 * /DataService/json/SyncReply/SelectQuery
	 */
	public get SelectQuery(): string {
		return this.getRoute(this._selectQuery);
	}
	private set SelectQuery(v: string) {
		this._selectQuery = v;
	}

	private _insertQuery: string = "/DataService/json/SyncReply/InsertQuery";
	/**
	 * - /DataService/json/SyncReply/InsertQuery
	 */
	public get InsertQuery(): string {
		return this.getRoute(this._insertQuery);
	}
	private set InsertQuery(v: string) {
		this._insertQuery = v;
	}

	private _deleteQuery: string = "/DataService/json/SyncReply/DeleteQuery";
	/**
	 * - /DataService/json/SyncReply/DeleteQuery
	 */
	public get DeleteQuery(): string {
		return this.getRoute(this._deleteQuery);
	}
	private set DeleteQuery(v: string) {
		this._deleteQuery = v;
	}

	private _updateQuery: string = "/DataService/json/SyncReply/UpdateQuery";
	/**
	 * - /DataService/json/SyncReply/UpdateQuery
	 */
	public get UpdateQuery(): string {
		return this.getRoute(this._updateQuery);
	}
	private set UpdateQuery(v: string) {
		this._updateQuery = v;
	}



	private _runProcess: string = "/ServiceModel/ProcessEngineService.svc/RunProcess";
	/**
	 * - /ServiceModel/ProcessEngineService.svc/RunProcess
	 */
	public get RunProcess(): string {
		return this.getRoute(this._runProcess);
	}
	private set RunProcess(v: string) {
		this._runProcess = v;
	}

	private _processSchemaRequest: string = "/DataService/json/SyncReply/ProcessSchemaRequest";
	/**
	 * - /DataService/json/SyncReply/ProcessSchemaRequest
	 */
	public get ProcessSchemaRequest(): string {
		return this.getRoute(this._processSchemaRequest);
	}
	private set ProcessSchemaRequest(v: string) {
		this._processSchemaRequest = v;
	}


	private _processSchemaParameter: string = "/DataService/json/SyncReply/ProcessSchemaParameter";
	/**
	 * - /DataService/json/SyncReply/ProcessSchemaParameter
	 */
	public get ProcessSchemaParameter(): string {
		return this.getRoute(this._processSchemaParameter);
	}
	private set ProcessSchemaParameter(v: string) {
		this._processSchemaParameter = v;
	}



	private _runtimeEntitySchemaRequest: string = "/DataService/json/SyncReply/RuntimeEntitySchemaRequest";
	/**
	 * - /DataService/json/SyncReply/RuntimeEntitySchemaRequest
	 */
	public get RuntimeEntitySchemaRequest(): string {
		return this.getRoute(this._runtimeEntitySchemaRequest);
	}
	private set RuntimeEntitySchemaRequest(v: string) {
		this._runtimeEntitySchemaRequest = v;
	}


	private _entitySchemaManagerRequest : string = "/DataService/json/SyncReply/EntitySchemaManagerRequest";
	/**
	 * - /DataService/json/SyncReply/EntitySchemaManagerRequest
	 */
	public get EntitySchemaManagerRequest() : string {
		return this.getRoute(this._entitySchemaManagerRequest);
	}
	private set EntitySchemaManagerRequest(v : string) {
		this._entitySchemaManagerRequest = v;
	}


	
	private _restartApp : string = "/ServiceModel/AppInstallerService.svc/RestartApp";
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
		this._restartApp = v;
	}
	

	
	private _clearRedisDb : string = "/ServiceModel/AppInstallerService.svc/ClearRedisDb";
	/**
	 * - /ServiceModel/AppInstallerService.svc/ClearRedisDb
	 */
	public get ClearRedisDb() : string {
		return this.getRoute(this._clearRedisDb);
	}
	private set ClearRedisDb(v : string) {
		this._clearRedisDb = v;
	}
	
	
	private _executeSqlScript : string = "/rest/CreatioApiGateway/ExecuteSqlScript";
	/**
	 * - /rest/CreatioApiGateway/ExecuteSqlScript
	 */
	public get ExecuteSqlScript() : string {
		return this.getRoute(this._executeSqlScript);
	}
	private set ExecuteSqlScript(v : string) {
		this._executeSqlScript = v;
	}
	
	
	private _pingWebHost : string = "/0/api/HealthCheck/Ping";
	/**
	 * - /0/api/HealthCheck/Ping
	 */
	public get PingWebHost() : string {
		return this._pingWebHost;
	}
	private set PingWebHost(v : string) {
		this._pingWebHost = v;
	}
	
	
	private _pingWebApp : string = "/api/HealthCheck/Ping";
	/**
	 * - /api/HealthCheck/Ping
	 */
	public get PingWebApp() : string {
		return this._pingWebApp;
	}
	private set PingWebApp(v : string) {
		this._pingWebApp = v;
	}
	
	
	private _getPackages : string = "/ServiceModel/PackageService.svc/GetPackages";
	public get GetPackages() : string {
		return this.getRoute(this._getPackages);
	}
	private set GetPackages(v : string) {
		this._getPackages = v;
	}
	
	private _getPackageProperties : string = "/ServiceModel/PackageService.svc/GetPackageProperties";
	public get GetPackageProperties() : string {
		return this.getRoute(this._getPackageProperties);
	}
	private set GetPackageProperties(v : string) {
		this._getPackageProperties = v;
	}
	
	
	private _getWorkspaceItems : string = "/ServiceModel/WorkspaceExplorerService.svc/GetWorkspaceItems";
	public get GetWorkspaceItems() : string {
		return this.getRoute(this._getWorkspaceItems);
	}
	private set GetWorkspaceItems(v : string) {
		this._getWorkspaceItems = v;
	}
	

	
	private _getClientUnitSchema : string = "/ServiceModel/ClientUnitSchemaDesignerService.svc/GetSchema";
	public get GetClientUnitSchema() : string {
		return this.getRoute(this._getClientUnitSchema);
	}
	private set GetClientUnitSchema(v : string) {
		this._getClientUnitSchema = v;
	}

	private _saveClientUnitSchema : string = "/ServiceModel/ClientUnitSchemaDesignerService.svc/SaveSchema";
	public get SaveClientUnitSchema() : string {
		return this.getRoute(this._saveClientUnitSchema);
	}
	private set SaveClientUnitSchema(v : string) {
		this._saveClientUnitSchema = v;
	}
	
	
	private _getSourceCodeSchema : string = "/ServiceModel/SourceCodeSchemaDesignerService.svc/GetSchema";
	public get GetSourceCodeSchema() : string {
		return this.getRoute(this._getSourceCodeSchema);
	}
	private set GetSourceCodeSchema(v : string) {
		this._getSourceCodeSchema = v;
	}
	
	private _saveSourceCodeSchema : string = "/ServiceModel/SourceCodeSchemaDesignerService.svc/SaveSchema";
	public get SaveSourceCodeSchema() : string {
		return this.getRoute(this._saveSourceCodeSchema);
	}
	private set SaveSourceCodeSchema(v : string) {
		this._saveSourceCodeSchema = v;
	}

	private _getSqlSchema : string = "/ServiceModel/SqlScriptSchemaDesignerService.svc/GetSchema";
	public get GetSqlSchema() : string {
		return this.getRoute(this._getSqlSchema);
	}
	private set GetSqlSchema(v : string) {
		this._getSqlSchema = v;
	}
	
	private _saveSqlSchema : string = "/ServiceModel/SqlScriptSchemaDesignerService.svc/SaveSchema";
	public get SaveSqlSchema() : string {
		return this.getRoute(this._saveSqlSchema);
	}
	private set SaveSqlSchema(v : string) {
		this._saveSqlSchema = v;
	}
	




	private _setFeatureState : string = "/rest/FeatureStateService/SetFeatureState";
	public get SetFeatureState() : string {
		return this.getRoute(this._setFeatureState);
	}
	private set SetFeatureState(v : string) {
		this._setFeatureState = v;
	}


	private _startLogBroadcast : string = "/rest/ATFLogService/StartLogBroadcast";
	/**
	 * Url to start listening to telemetry service
	 */
	public get StartLogBroadcast() : string {
		return this.getRoute(this._startLogBroadcast);
	}
	private set StartLogBroadcast(v : string) {
		this._startLogBroadcast = v;
	}

	private _stopLogBroadcast : string = "/rest/ATFLogService/ResetConfiguration";
	/**
	 * Url to stop listening to telemetry service
	 */
	public get StopLogBroadcast() : string {
		return this.getRoute(this._stopLogBroadcast);
	}
	private set StopLogBroadcast(v : string) {
		this._stopLogBroadcast = v;
	}



	
	/**
	 * WebSocket connection page
	 */
	private _webSocket : string = "/Nui/ViewModule.aspx.ashx";
	public get WebSocket() : string {
		return this.getRoute(this._webSocket);
	}
	public set WebSocket(v : string) {
		this._webSocket = v;
	}
	
	/**
	 *
	 * @param isNetCore Indicates if routes are for netCore app
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
