import { ClioExecutor } from '../common/clioExecutor';
import { BaseCommand, ICanExecuteValidationResult, ICommand, ICommandArgs, ICommandResponse } from './BaseCommand';

/**
 * FlushDB arguments
 */
export interface ILockPkgArgs extends ICommandArgs{
	pkgName: string
}

/**
 * FlushDb response
 */
export interface ILockPkgResponse extends ICommandResponse{}

export class LockPkg extends BaseCommand implements ICommand<ILockPkgArgs, ILockPkgResponse> {
	
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
	canExecute(args: ILockPkgArgs): ICanExecuteValidationResult {
		
		//Validate that the environment name is set
		if(!args.environmentName){
			this._validationResult = {
				success: false,
				message: "Environment name cannot be empty"
			};
			return this._validationResult;
		}
		
		if(!args.pkgName){
			this._validationResult = {
				success: false,
				message: "Package name cannot be empty"
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
	async executeAsync(args: ILockPkgArgs): Promise<ILockPkgResponse> {
		if(!this._validationResult.success){
			throw new Error("Make sure to call canExecute before calling execute");
		}
		const result = await this.executor.ExecuteClioCommand(`clio lock-package ${args.pkgName} -e ${args.environmentName}`);
		return this.convertResult(result);
	}

	private convertResult(clioResult : String) : ILockPkgResponse{
		if(clioResult.toLowerCase().indexOf("done") > -1){
			return {
				success : true,
				message : "successfully completed"
			} as ILockPkgResponse;
		}else{
			return {
				success : false,
				message : clioResult
			} as ILockPkgResponse;
		}
	}
}