import { MarketplaceClient } from "./marketplaceClient";
import { SemVer } from "semver";

export class MarketplaceApp{

	public readonly title: string;
	public readonly moderationState : ModerationState;
	public readonly id: string;
	public readonly internalNid: number;
	public readonly internalVid: number;
	public readonly shortDescription: string;
	public readonly longDescription: string;
	public readonly isCertified : boolean;
	public readonly totalViews : number;
	public readonly totalDownloads : number;
	private readonly _marketplaceClient = new MarketplaceClient();
	private readonly _path : string;
	

	public async FillAllPropertiesAsync() : Promise<void>{
		const results = await Promise.all([
			this._marketplaceClient.GetFieldApplicationMapAsync(this.id, this.internalVid),
			this._marketplaceClient.GetAppCompatibilityVersionAsync(this.id, this.internalVid),
			this._marketplaceClient.GetAppCompatibilityAsync(this.id, this.internalVid),
			this._marketplaceClient.GetAppLanguageAsync(this.id, this.internalVid),
			this._marketplaceClient.GetDeveloperAsync(this.id, this.internalVid),
			this._marketplaceClient.GetAppCompatibilityDbmsAsync(this.id, this.internalVid),
			this._marketplaceClient.GetAppCompatibilityPlatformAsync(this.id, this.internalVid),
			this._marketplaceClient.GetAppProductCategoryAsync(this.id, this.internalVid),
			this._marketplaceClient.GetAppLogoAsync(this.id, this.internalVid)
			
		]);
		
		this._applicationMap = results[0];
		this._appCompatibilityVersion = results[1];
		this._appCompatibility = results[2];
		this._appLanguages = results[3];
		this._appDeveloper = results[4];
		this._appCompatibleDbms = results[5];
		this._appCompatiblePlatform = results[6];
		this._appProductCategory = results[7];
		this._appLogo = results[8];
	}


	public get MarketplaceUrl(): URL {
		return new URL(`https://marketplace.creatio.com${this._path}`);
	}

	private _applicationMap : string[] = [];
	public get ApplicationMap() : string[] {
		return this._applicationMap;
	}
	
	private _appCompatibilityVersion : SemVer = new SemVer("0.0.0");
	/**
	 * Lowest semantic version of a compatible app {@link https://github.com/npm/node-semver#readme | See SemVer Documentation}
	 */
	public get AppCompatibilityVersion() : SemVer {
		return this._appCompatibilityVersion;
	}
	
	private _appCompatibility : string[] = [];
	public get AppCompatibility() : string[] {
		return this._appCompatibility;
	}
	
	private _appLanguages : string[] = [];
	public get AppLanguages() : string[] {
		return this._appLanguages;
	}
	
	private _appLogo : string | undefined;
	public get AppLogo() : string | undefined {
		return this._appLogo;
	}
	
	public get AppPrice() : Promise<string[]> {
		throw new Error();
	}
	
	private _appProductCategory: ProductCategory = ProductCategory.Unknown;
	public get AppProductCategory() : ProductCategory {
		return this._appProductCategory;
	}
		
	private _appCompatibleDbms : DbmsCompatibility[] = [];
	public get AppCompatibleDbms() : DbmsCompatibility[] {
		return this._appCompatibleDbms;
	}
	
	private _appCompatiblePlatform : CompatiblePlatform[] = [];
	/**
	 * Returns compatible platform
	 * - .Net core
	 * - .Net Framework
	 */
	public get AppCompatiblePlatform() : CompatiblePlatform[] {
		return this._appCompatiblePlatform;
	}
	
	private _appDeveloper : string | undefined;
	public get AppDeveloper() : string | undefined {
		return this._appDeveloper;
	}
	
	/**
	 * 
	 * @param id Drupal application id
	 * @param internal_nid drupal internal id
	 * @param internal_vid drupal internal version id
	 * @param title Application title
	 * @param moderationState Application moderation state
	 * @param shortDescription Application short description
	 * @param longDescription Application long description
	 * @param path Application alias prepend https://marketplace.creatio.com to get marketplace app url
	 * @param isCertified Application alias
	 * @param totalViews Total application views
	 * @param totalDownloads Total application downloads
	 */
	constructor(id: string, internal_nid:number, internal_vid:number, title: string, moderationState: ModerationState, 
		shortDescription: string, longDescription: string,path: string, isCertified: boolean, totalViews: number, totalDownloads: number)
	{
		this.id = id;
		this.internalNid = internal_nid;
		this.internalVid = internal_vid;
		this.title = title;
		this.moderationState = moderationState;
		this.shortDescription = shortDescription;
		this.longDescription = longDescription;
		this._path = path;
		this.isCertified = isCertified;
		this.totalViews = totalViews;
		this.totalDownloads=totalDownloads;
	}
}

export enum ModerationState{
	published = 0,
	upcoming = 1
}


export enum DbmsCompatibility{
	Unknown = 0,
	All = 1,
	MsSql = 2,
	Oracle = 3,
	PgSql = 4
}

export enum CompatiblePlatform{
	Unknown = 0,
	All = 1,
	NetCore = 2,
	NetFramework=3
}

export enum ProductCategory{
	Unknown = 0,
	SoftwareSolution = 1,
	Connector = 2,
	AddOn = 3
}