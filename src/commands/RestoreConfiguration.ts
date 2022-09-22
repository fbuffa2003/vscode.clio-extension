import { ClioExecutor } from '../Common/clioExecutor';
import { BaseCommand, ICanExecuteValidationResult, ICommand, ICommandArgs, ICommandResponse } from './BaseCommand';

/**
 * RestoreConfiguration arguments
 */
export interface IRestoreConfigurationArgs extends ICommandArgs{}

/**
 * RestoreConfiguration response
 */
export interface IRestoreConfigurationResponse extends ICommandResponse{}

export class RestoreConfiguration extends BaseCommand implements ICommand<IRestoreConfigurationArgs, IRestoreConfigurationResponse> {
	
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
	canExecute(args: IRestoreConfigurationArgs): ICanExecuteValidationResult {
		
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
	 * Executes RestoreConfiguration command
	 * @param args Arguments to pass to clio
	 * @returns Result of the operation
	 */
	async executeAsync(args: IRestoreConfigurationArgs): Promise<IRestoreConfigurationResponse> {
		if(!this._validationResult.success){
			throw new Error("Make sure to call canExecute before calling execute");
		}
		const result = await this.executor.ExecuteClioCommand(`clio restore ${args.environmentName}`);
		return this.convertResult(result);
	}

	private convertResult(clioResult : String) : IRestoreConfigurationResponse{
		if(clioResult.toLowerCase().indexOf("done") > -1){
			return {
				success : true,
				message : "successfully completed"
			} as IRestoreConfigurationResponse;
		}else{
			return {
				success : false,
				message : clioResult
			} as IRestoreConfigurationResponse;
		}
	}
}