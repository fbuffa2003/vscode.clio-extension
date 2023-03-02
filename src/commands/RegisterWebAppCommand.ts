import { ClioExecutor } from '../Common/clioExecutor';
import { BaseCommand, ICanExecuteValidationResult, ICommand, ICommandArgs, ICommandResponse } from './BaseCommand';

/**
 * RegisterWebApp arguments
 * - See _clio Create/Update environment_ {@link https://github.com/Advance-Technologies-Foundation/clio#createupdate-an-environment documentation}
 */
export interface IRegisterWebAppArgs extends ICommandArgs{
	
	 /**
	  * Connection url
	  */
	 url : String;
 
	 /**
	  * Username for the connection
	  */
	 username: String;
 
	 /**
	  * Password for the connection
	  */
	 password: String;
 
	 /**
	  * Maintainer for the connection
	  */
	 maintainer: String;
 
	 /**
	  * Indicates that connection to a NetCore Creatio instance
	  */
	 isNetCore: Boolean;
 
	 /**
	  * Will ask for confirmation for every command
	  */
	 isSafe: Boolean;
 
	 /**
	  * Will unlock packages
	  */
	 isDeveloperModeEnabled: Boolean;


	 clientId: string,
	 clientSecret: string
}

/**
 * RegisterWebApp response
 */
export interface IRegisterWebAppResponse extends ICommandResponse{}

export class RegisterWebApp extends BaseCommand implements ICommand<IRegisterWebAppArgs, IRegisterWebAppResponse> {
	
	constructor(public executor: ClioExecutor) {
		super(executor);
	}

	/**
	 * Validates arguments
	 * @param args 
	 * @returns Result of validation
	 */
	canExecute(args: IRegisterWebAppArgs): ICanExecuteValidationResult {
		
		//Validate that the environment name is set
		if(!args.environmentName){
			this._validationResult = {
				success: false,
				message: "Environment name cannot be empty"
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
	async executeAsync(args: IRegisterWebAppArgs): Promise<IRegisterWebAppResponse> {
		
		if(!this._validationResult.success){
			throw new Error(`${this._validationResult.message}`);
		}
		let oauthUri = "";
		if(args.url.indexOf(".creatio.com")>-1){
			oauthUri = args.url.replace('.creatio.com', '-is.creatio.com/connect/token');
		}
		//TODO: do better
		const cmd = `clio reg-web-app ${args.environmentName} -u \"${args.url}\" -l \"${args.username}\" -p \"${args.password}\" -m \"${args.maintainer}\" -i ${args.isNetCore} -c ${args.isDeveloperModeEnabled} -s ${args.isSafe} --clientId \"${args.clientId}\" --clientSecret \"${args.clientSecret}\" --authAppUri \"${oauthUri}\"`;
		const result = await this.executor.ExecuteClioCommand(cmd);
		return this.convertResult(result, args);
	}

	private convertResult(clioResult : String, args: IRegisterWebAppArgs) : IRegisterWebAppResponse {
		
		// L108 spelling mistake in Envronment
		//RFT: Change RegAppCommand.cs -> Commit a737e7ad. 
		return {
			success : clioResult.startsWith(`Envronment ${args.environmentName} was configured...`) || clioResult.startsWith(`Environment ${args.environmentName} was configured...`),
			message : clioResult
		} as IRegisterWebAppResponse;
	}
}