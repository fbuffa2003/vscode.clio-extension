import { Client, Pool } from 'pg';

export class pgClient{

	//TODO: build connectionstring from env-settings
	private readonly _connectionString: string = 'postgresql://postgres:root@localhost:30432/postgres';
	private readonly _client: Client = new Client(this._connectionString);

	private _pool = new Pool({
		user: "postgres",
		password: "root",
		host: "localhost",
		port: 30432,
		database: "postgres",
		max: 10
	});


	constructor() {
		(async()=>{
			try{
				await this._client.connect();
			}
			catch(error){
				const err = error as any;
				throw new Error(`COULD NOT CONNECT TO DATABASE ${err.message}`);
			}
			
		})();
	}

	public async getTemplatesAsync(): Promise<Map<string, string>>{

		const select =`
		SELECT datname, pg_catalog.shobj_description(d.oid, 'pg_database') AS "Description"
		FROM   pg_catalog.pg_database d
		WHERE datistemplate = true 
		AND NOT(datname = ANY('{template1, template0}'));
		`;

		const rowMap = new Map<string, string>();


		try	{
			const result = await this._client.query(select);
			if(result){
				result.rows.forEach(row=>{
					const datnmame = row['datname'] as string;
					const description = row['Description'] as string;
					rowMap.set(datnmame, description ?? 'empty comment');
				});
			}
			return rowMap;
		}
		catch(error){
			const err = error as any;
			const msg = `COULD NOT GET Templates FROM DB ${err.message}`;
			console.log(msg);
			throw new Error(`COULD NOT GET Templates FROM DB ${err.message}`);
		}


	}

	public async dropIfExistsAsync(dbName: string): Promise<void>{
		await this.markDbAsNotTemplate(dbName);
		const sql =`DROP DATABASE IF EXISTS ${dbName} WITH (FORCE)`;
		
		try{
			const result  = await this._client.query(sql);
		}
		catch(error){
			const err = error as object as any;
			throw new Error(`COULD NOT DROP DATABASE ${err.message}`);
		}
	}
	
	public async createTemplateDbAsync(dbName: string): Promise<void>{
		const sql =`CREATE DATABASE ${dbName} ENCODING='UTF8' CONNECTION LIMIT=-1 IS_TEMPLATE='TRUE'`;
		await this._client.query(sql);
	}
	
	private async markDbAsNotTemplate(dbName: string): Promise<void>{
		const sql =`UPDATE pg_database SET datistemplate='false' WHERE datname='${dbName}'`;
		await this._client.query(sql);
	}

	public async restoreFromTemplateAsync(dbName: string, templateName: string): Promise<void>{
		const sql =`CREATE DATABASE ${dbName} TEMPLATE='${templateName}' ENCODING='UTF8' CONNECTION LIMIT=-1`;
		await this._client.query(sql);
	}

	public async addCommentToDb(dbName:string, comment: string): Promise<void>{
		
		try{
			const sql =`COMMENT ON DATABASE ${dbName} IS '${comment}'`;
			await this._client.query(sql);
		}
		catch(error){
			const err = error as object as any;
			throw new Error(`COULD NOT ADD COMMENT: ${comment} TO DATABASE:${dbName} ${err.message}`);
		}
	}




	public dispose():void{
		(async()=>{
			await this._client.end();
		})();
	}

}