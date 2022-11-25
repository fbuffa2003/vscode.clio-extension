import { ClioExecutor } from '../Common/clioExecutor';
import { BaseCommand, ICanExecuteValidationResult, ICommand, ICommandArgs, ICommandResponse } from './BaseCommand';

/**
 * DownloadPackage arguments
 */
export interface IDownloadPackageArgs extends ICommandArgs{
	destinationPath: string
	packageName: string
}

/**
 * DownloadPackage response
 */
export interface IDownloadPackageResponse extends ICommandResponse{}

export class DownloadPackage extends BaseCommand implements ICommand<IDownloadPackageArgs, IDownloadPackageResponse> {
	
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
	canExecute(args: IDownloadPackageArgs): ICanExecuteValidationResult {
		
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
	async executeAsync(args: IDownloadPackageArgs): Promise<IDownloadPackageResponse> {
		
		if(!this._validationResult.success){
			throw new Error("Make sure to call canExecute before calling execute");
		}
		//TODO: CHANGE TO CLIO-DEV
		const result = await this.executor.ExecuteClioCommand(`clio pull-pkg ${args.packageName} -d ${args.destinationPath} -e ${args.environmentName} -r`);
		return this.convertResult(result);
	}

	private convertResult(clioResult : String) : IDownloadPackageResponse{
		if(clioResult.endsWith('Done\r\n')){
			return {
				success : true,
				message : "successfully completed"
			} as IDownloadPackageResponse;
		}else{
			return {
				success : false,
				message : clioResult
			} as IDownloadPackageResponse;
		}
	}
}