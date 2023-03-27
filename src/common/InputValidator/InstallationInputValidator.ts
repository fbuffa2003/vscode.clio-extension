import { PowerShell } from 'node-powershell';
export class InstallationInputValidator{

	private _takenPorts : Array<number> = new Array<number>();
	public get takenPorts() : Array<number> {
		return this._takenPorts;
	}
	private set takenPorts(v : Array<number>) {
		this._takenPorts = v;
	}
	
	
	private _takenNames : Array<string> = new Array<string>();
	public get takenNames() : Array<string> {
		return this._takenNames;
	}
	private set takenNames(v : Array<string>) {
		this._takenNames = v;
	}
	
	/**
	 *
	 */
	constructor() {
		(async()=>{
			await this.collectIISBindings();
		})();

	}

	private async collectIISBindings(): Promise<void>{
		const ps = await PowerShell.$`Get-WebBinding | ConvertTo-Json`;
		if(ps.hadErrors){
			return;
		}

		if(ps.raw.startsWith('{')){
			ps.raw = `[${ps.raw}]`;
		}

		const json : Array<IiisBindingDto> = JSON.parse(ps.raw) as Array<IiisBindingDto>;

		json.forEach(item=>{
			const bi_items = item.bindingInformation.split(':');
			const ip = bi_items[0];
			const port = parseInt(bi_items[1]);
			const hostName = bi_items[2];

			
			if(!this.takenPorts.find(p=> p===port)){
				this.takenPorts.push(port);
			}

			const regex = /@name=\'.*\'\s/;
			const names = item.ItemXPath.match(regex);
			if(names?.length && names?.length> 0){
				const clean = (names[0] as string);
				const siteName = clean.split('=')[1].replaceAll('\'','').trim();
				
				if(!this.takenNames.find(n=> n===siteName)){
					this.takenNames.push(siteName);
				}
			}
		});

	}
}


export interface IiisBindingDto{
	protocol: string;
	bindingInformation: string;
	sslFlags: number;
	ItemXPath: string;
	PSComputerName: string;
}