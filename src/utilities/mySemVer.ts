export class mySemVer{

	private _major : number = 0;
	public get major() : number {
		return this._major;
	}
	private set major(v : number) {
		this._major = v;
	}
	
	private _minor : number = 0;
	public get minor() : number {
		return this._minor;
	}
	private set minor(v : number) {
		this._minor = v;
	}
	
	private _patch : number = 0;
	public get patch() : number {
		return this._patch;
	}
	private set patch(v : number) {
		this._patch = v;
	}
	
	private _revision : number = 0;
	public get revision() : number {
		return this._revision;
	}
	private set revision(v : number) {
		this._revision = v;
	}
	
	/**
	 *
	 */
	constructor(version: string | mySemVer) {
		
		if(version instanceof mySemVer){
			this.major = version.major;
			this.minor = version.minor;
			this.patch = version.patch;
			this.revision = version.revision;
		}else{

			const _parts = version.split('.',4);
			if(_parts && _parts[0]){
				const _mj = Number.parseInt(_parts[0]);
				this.major = isNaN(_mj)  ? 0: _mj;
			}
			if(_parts && _parts[1]){
				const _mn = Number.parseInt(_parts[1]);
				this.minor = isNaN(_mn) ? 0 : _mn;
			}
			if(_parts && _parts[2]){
				const _pt = Number.parseInt(_parts[2]);
				this.patch = isNaN(_pt) ? 0 : _pt;
			}
			if(_parts && _parts[3]){
				const _rv = Number.parseInt(_parts[3]);
				this.revision = isNaN(_rv) ? 0: _rv;
			}
		}
	}

	public toString(): string{
		return `${this.major}.${this.minor}.${this.patch}.${this.revision}`;
	}

	public compare(compVersion: string | mySemVer) : -1|0|1 {
		
		const _temp = new mySemVer(compVersion);

		if(this.major > _temp.major){
			return 1;
		}else if(this.major < _temp.major){
			return -1;
		}

		if(this.minor > _temp.minor){
			return 1;
		}else if(this.minor < _temp.minor){
			return -1;
		}
		
		if(this.patch > _temp.patch){
			return 1;
		}else if(this.patch < _temp.patch){
			return -1;
		}
		
		if(this.revision > _temp.revision){
			return 1;
		}else if(this.revision < _temp.revision){
			return -1;
		}
		return 0;
	}
}