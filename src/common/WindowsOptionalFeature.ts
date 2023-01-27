import { PowerShell } from 'node-powershell';

export class RequiredFeatures{
	private _items : Map<string, IWindowsOptionalFeature> = new Map<string, IWindowsOptionalFeature>();
	public get Items() : Map<string, IWindowsOptionalFeature> {
		return this._items;
	}
	private set Items(v : Map<string, IWindowsOptionalFeature>) {
		this._items = v;
	}
	/**
	 *
	 */
	
	constructor() {

		//TODO: Are these really the features we need ?
		const features: Array<string> = [
			"NetFx4-AdvSrvs",
			"NetFx4Extended-ASPNET45",
			"WAS-WindowsActivationService",
			"WAS-ProcessModel",
			"WAS-ConfigurationAPI",
			"WorkFolders-Client",
			//"WCF-HTTP-Activation",
			"WCF-HTTP-Activation45",
			//"WCF-NonHTTP-Activation",
			"WCF-TCP-Activation45",
			"WCF-Pipe-Activation45",
			"WCF-MSMQ-Activation45",
			"WCF-TCP-PortSharing45",
			//"WAS-NetFxEnvironment",
			"IIS-WindowsAuthentication",
			"IIS-WebServerRole",
			"IIS-WebServer",
			"IIS-CommonHttpFeatures",
			"IIS-HttpErrors",
			"IIS-HttpRedirect",
			"IIS-ApplicationDevelopment",
			"IIS-HealthAndDiagnostics",
			"IIS-HttpLogging",
			"IIS-LoggingLibraries",
			"IIS-RequestMonitor",
			"IIS-Security",
			"IIS-RequestFiltering",
			"IIS-IPSecurity",
			"IIS-WebServerManagementTools",
			"IIS-StaticContent",
			"IIS-DefaultDocument",
			"IIS-DirectoryBrowsing",
			"IIS-WebSockets",
			"IIS-ApplicationInit",
			"IIS-ISAPIExtensions",
			"IIS-ISAPIFilter",
			"IIS-ServerSideIncludes",
			"IIS-CustomLogging",
			"IIS-BasicAuthentication",
			"IIS-ManagementConsole",
			"IIS-WindowsAuthentication",
			//"IIS-NetFxExtensibility",
			"IIS-NetFxExtensibility45",
			//"IIS-ASPNET",
			"IIS-ASPNET45",
			"IIS-ASP"
		];

		features.forEach(f=>{
			const ff = new WindowsOptionalFeature(f);
			this.Items.set(f, new WindowsOptionalFeature(f));
		});
	}

}


class WindowsOptionalFeature implements IWindowsOptionalFeature {
	
	private _isEnabled : boolean = false;
	public get IsEnabled() : boolean {
		return this._isEnabled;
	}
	private set IsEnabled(v : boolean) {
		this._isEnabled = v;
	}
	
	private _isRestartRequired : boolean = true;
	public get IsRestartRequired() : boolean {
		return this._isRestartRequired;
	}
	private set IsRestartRequired(v : boolean) {
		this._isRestartRequired = v;
	}
	
	private _displayName : string = '';
	public get DisplayName() : string {
		return this._displayName;
	}
	private set DisplayName(v : string) {
		this._displayName = v;
	}


	private _description : string = '';
	public get Description() : string {
		return this._description;
	}
	private set Description(v : string) {
		this._description = v;
	}

	private _featureName : string = '';
	public get FeatureName() : string {
		return this._featureName;
	}
	private set FeatureName(v : string) {
		this._featureName = v;
	}



	constructor	(name: string){
		this.FeatureName = name;
	}

	public async describeAsync() : Promise<void>{
		const result = await PowerShell.$` Get-WindowsOptionalFeature -Online -FeatureName ${this.FeatureName} | ConvertTo-Json`;

		if(result){
			const json = JSON.parse(result.raw);
			this.IsEnabled = (json['State'] as number) === 2 ? true : false;
			this.IsRestartRequired = json['RestartNeeded'] as boolean;
			this.DisplayName = json['DisplayName'] as string;
			this.Description = json['Description'] as string;
		}
	}

	public async enableAsync(): Promise<void>{
		await PowerShell.$` Enable-WindowsOptionalFeature -Online -FeatureName ${this.FeatureName} -All --NoRestart | ConvertTo-Json`;
		await this.describeAsync();
	}
}

export interface IWindowsOptionalFeature{
	
	/**
	 * Specifies the name of the feature to be enabled. Feature names are case sensitive if you are servicing a Windows image running a version of Windows earlier than Windows® 8. You can use Get-WindowsOptionalFeature to find the name of the feature in the image.
	 * 
	 * See {@link https://learn.microsoft.com/en-us/powershell/module/dism/get-windowsoptionalfeature?view=windowsserver2022-ps#-featurename Mirosoft Doc} for details
	 */
	readonly FeatureName : string;
	readonly DisplayName : string;
	readonly Description : string;
	readonly IsEnabled : boolean;
	readonly IsRestartRequired : boolean;

	/**
	 * Gets information about optional features in a Windows image.
	 * 
	 * See {@link https://learn.microsoft.com/en-us/powershell/module/dism/get-windowsoptionalfeature?view=windowsserver2022-ps Mirosoft Doc} for details.
	 */
	describeAsync(): Promise<void>;

	/**
	 * Enables a feature in a Windows image.
	 * 
	 * See {@link https://learn.microsoft.com/en-us/powershell/module/dism/enable-windowsoptionalfeature?view=windowsserver2022-ps Mirosoft Doc} for details.
	 */
	enableAsync(): Promise<void>;
}



