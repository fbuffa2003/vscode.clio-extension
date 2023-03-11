import { ClioExecutor } from '../../common/clioExecutor';
import { BaseCommand, ICanExecuteValidationResult, ICommand, ICommandArgs, ICommandResponse } from '../BaseCommand';

/**
 * Get packages arguments
 */
export interface IGetPackagesDevArgs extends ICommandArgs{}

/**
 * Get packages response
 */
export interface IGetPackagesDevResponse extends ICommandResponse{
	data: Array<IPackageModel>
}

export interface IPackageModel{
	name: string,
	version: string,
	maintainer: string
	uId: string
}

export class GetPackagesDev extends BaseCommand implements ICommand<IGetPackagesDevArgs, IGetPackagesDevResponse> {
	
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
	canExecute(args: IGetPackagesDevArgs): ICanExecuteValidationResult {
		
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
	async executeAsync(args: IGetPackagesDevArgs): Promise<IGetPackagesDevResponse> {
		
		if(!this._validationResult.success){
			throw new Error("Make sure to call canExecute before calling execute");
		}
		const result = await this.executor.ExecuteClioCommand(`clio packages -e ${args.environmentName}`);
		return this.convertResult(result);
	}

	private convertResult(clioResult : String) : IGetPackagesDevResponse{

		const lines = clioResult.split('\r\n');
		const data = new Array<IPackageModel>();
		for(let i = 3; i< lines.length-1-4; i++){	
			data.push({
				 name : lines[i].substring(0,33).trim(),
				 version : lines[i].substring(33,46).trim(),
				 maintainer : lines[i].substring(46,lines[i].length).trim(),
			} as IPackageModel);
		}
		
		return {
			success: true,
			message : "All good",
			data : data
		} as IGetPackagesDevResponse;
	}
}