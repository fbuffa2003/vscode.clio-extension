import { ClioExecutor } from '../common/clioExecutor';
import { BaseCommand, ICanExecuteValidationResult, ICommand, ICommandArgs, ICommandResponse } from './BaseCommand';
import * as fs from 'fs';
import { rm, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import path = require('path');

/**
 * SQL arguments
 * - See clio {@link https://github.com/Advance-Technologies-Foundation/clio/blob/master/README.md#execute-custom-sql-script documentation}
 */
export interface ISqlArgs extends ICommandArgs{
	/**
	 * SQL Text to execute
	 */
	sqlText: String;
}

/**
 * SQL response
 */
export interface ISqlResponse extends ICommandResponse{}

export class Sql extends BaseCommand implements ICommand<ISqlArgs, ISqlResponse> {
	
	/**
	 * Constructor
	 */
	constructor(public executor: ClioExecutor) {
		super(executor);
	}

	/**
	 * Validates arguments
	 * @param args 
	 * @returns Result of validation
	 */
	canExecute(args: ISqlArgs): ICanExecuteValidationResult {
		
		//Validate that the environment name is set
		if(!args.environmentName){
			this._validationResult = {
				success: false,
				message: "Environment name cannot be empty"
			};
			return this._validationResult;
		}

		if(!args.sqlText){
			this._validationResult = {
				success: false,
				message: "SQL Text cannot be empty"
			};
			return this._validationResult;
		}

		this._validationResult = {
			success: true,
			message: ""
		};
		return this._validationResult;
	}
	
	/**
	 * Executes FlushDb command
	 * @param args Arguments to pass to clio
	 * @returns Result of the operation
	 */
	async executeAsync(args: ISqlArgs): Promise<ISqlResponse> {
		
		if(!this._validationResult.success){
			throw new Error(`${this._validationResult.message}`);
		}

		const appSettingPath = await this.executor.ExecuteClioCommand("clio externalLink clio://GetAppSettingsFilePath");
		//const dir = `${getAppDataPath()}\\..\\Local\\creatio\\clio\\SQL`;
		const dir = path.join(appSettingPath, "SQL");
		if(!fs.existsSync(dir)){
			fs.mkdirSync(dir);
		}
		const filePath = path.join(`${dir}\\${randomUUID()}.sql`);
		await writeFile(filePath, args.sqlText);
		
		const result = await this.executor.ExecuteClioCommand(`clio sql -e ${args.environmentName} -f ${filePath}`);
		await rm(filePath);
		return this.convertResult(result, args);
	}

	private convertResult(clioResult : String, args: ISqlArgs) : ISqlResponse{
		
		const startsWithSqlText: Boolean = clioResult.startsWith(args.sqlText.toString(), 0);
		const endsWithDone: Boolean = clioResult.endsWith('Done\r\n');

		if(startsWithSqlText && endsWithDone){
			return {
				success : true,
				message : clioResult
			} as ISqlResponse;	
		} else{
			return {
				success : false,
				message : clioResult
			} as ISqlResponse;	
		}
	}
}