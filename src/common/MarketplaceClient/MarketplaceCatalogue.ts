import { MarketplaceApp } from "./marketplaceApp";
import { MarketplaceClient } from "./marketplaceClient";

export class MarketplaceCatalogue{

	private readonly _marketplaceClient : MarketplaceClient = new  MarketplaceClient();

	private _applications : Array<MarketplaceApp> = [];
	public get Applications() : Array<MarketplaceApp> {
		return this._applications;
	}
	private set Applications(v :  Array<MarketplaceApp>) {
		this._applications = v;
	}
	
	/**
	 *
	 */
	constructor() {}

	public async FillCatalogueAsync(): Promise<void>{
		this.Applications = await this._marketplaceClient.GetCatalogueAsyncParallel();
	}
}