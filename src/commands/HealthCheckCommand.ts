
import { ClioExecutor } from '../Common/clioExecutor';
import { BaseCommand, ICanExecuteValidationResult, ICommand, ICommandArgs, ICommandResponse } from './BaseCommand';

/**
 * HealthCheck arguments
 * - See clio {@link https://github.com/Advance-Technologies-Foundation/clio/blob/master/README.md#healthcheck documentation}
 */
export interface IHealthCheckArgs extends ICommandArgs{
	webApp: Boolean;
	webHost: Boolean;
}

/**
 * HealthCheck response
 * 
 */
export interface IHealthCheckResponse extends ICommandResponse{
	isWebAppHeathy: Boolean;
	isWebHostHealthy: Boolean;
}

export class HealthCheck extends BaseCommand implements ICommand<IHealthCheckArgs, IHealthCheckResponse> {
	
	constructor(public executor: ClioExecutor) {
		super(executor);
	}

	/**
	 * Validates arguments
	 * @param args 
	 * @returns Result of validation
	 */
	canExecute(args: IHealthCheckArgs): ICanExecuteValidationResult {
		
		//Validate that the environment name is set
		if(!args.environmentName){
			this._validationResult = {
				success: false,
				message: "Environment name cannot be empty"
			};
			return this._validationResult;
		}

		if(!args.webApp && !args.webHost){
			this._validationResult = {
				success: false,
				message: "Either webApp or webHost has to be true"
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
	async executeAsync(args: IHealthCheckArgs): Promise<IHealthCheckResponse> {
		if(!this._validationResult.success){
			throw new Error(`${this._validationResult.message}`);
		}

		const result = await this.executor.ExecuteClioCommand(`clio healthcheck ${args.environmentName} --WebApp ${args.webApp} --WebHost ${args.webHost}`);
		return this.convertResult(result, args);
	}

	private convertResult(clioResult : String, args: IHealthCheckArgs) : IHealthCheckResponse{
		
		const isWebHostOk =  clioResult.match(/\tWebHost - OK/);
		const isWebAppLoaderOk = clioResult.match(/\tWebAppLoader - OK/);

		const isWebAppHeathy : Boolean =(isWebAppLoaderOk) ? true : false;
		const isWebHostHeathy : Boolean =(isWebHostOk) ? true : false;
		
		const result : Boolean = (isWebAppHeathy && isWebHostHeathy);
		return new HealthCheckResponse(isWebAppHeathy, isWebHostHeathy, result, clioResult);
	}
}

class HealthCheckResponse implements IHealthCheckResponse{
	constructor(
		public isWebAppHeathy: Boolean, 
		public isWebHostHealthy: Boolean, 
		public success: Boolean, 
		public  message: String
	) {
		this.isWebAppHeathy = isWebAppHeathy;
		this.isWebAppHeathy = isWebAppHeathy;
		this.success = success;
		this.message = message;
	}
}