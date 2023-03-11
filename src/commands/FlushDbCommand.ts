import { ClioExecutor } from '../common/clioExecutor';
import { BaseCommand, ICanExecuteValidationResult, ICommand, ICommandArgs, ICommandResponse } from './BaseCommand';

/**
 * FlushDB arguments
 */
export interface IFlushDbArgs extends ICommandArgs{}

/**
 * FlushDb response
 */
export interface IFlushDbResponse extends ICommandResponse{}

export class FlushDb extends BaseCommand implements ICommand<IFlushDbArgs, IFlushDbResponse> {
	
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
	canExecute(args: IFlushDbArgs): ICanExecuteValidationResult {
		
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
	async executeAsync(args: IFlushDbArgs): Promise<IFlushDbResponse> {
		
		if(!this._validationResult.success){
			throw new Error("Make sure to call canExecute before calling execute");
		}
		const result = await this.executor.ExecuteClioCommand(`clio flushdb -e ${args.environmentName}`);
		return this.convertResult(result);
	}

	private convertResult(clioResult : String) : IFlushDbResponse{
		if(clioResult === 'Done\r\n'){
			return {
				success : true,
				message : "successfully completed"
			} as IFlushDbResponse;
		}else{
			return {
				success : false,
				message : clioResult
			} as IFlushDbResponse;
		}
	}
}