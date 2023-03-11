import exp = require("constants");
import { ClioExecutor } from "../common/clioExecutor";

export abstract class BaseCommand {

	protected _executor: ClioExecutor;
	protected _validationResult: ICanExecuteValidationResult;
	/**
	 * Constructor
	 */
	constructor(public executor: ClioExecutor) {
		this._executor = executor;
		this._validationResult = {success: false, message: ''} as ICanExecuteValidationResult;
	}
	abstract canExecute(args: ICommandArgs): ICanExecuteValidationResult;
	abstract executeAsync(args: ICommandArgs): Promise<ICommandResponse>;
}


export interface ICommand<ICommandArgs, ICommandResponse> {
	canExecute(args: ICommandArgs) : ICanExecuteValidationResult;
	executeAsync(args: ICommandArgs): Promise<ICommandResponse>;
}

export interface ICommandArgs{
	environmentName: String;
}

export interface ICommandResponse{
	success : Boolean;
	message: String
}

/**
 * Command argument validation result
 */
export interface ICanExecuteValidationResult{
	
	/**
	 * Result of validation
	 */
	readonly success : Boolean;
	
	/**
	 * Error message is validation failed
	 */
	readonly message: String
}