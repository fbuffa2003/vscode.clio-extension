import { ClioExecutor } from '../Common/clioExecutor';
import { ICommand, ICommandArgs, ICommandResponse } from './BaseCommand';
import {FlushDb,IFlushDbArgs,IFlushDbResponse } from './FlushDbCommand';
import { HealthCheck, IHealthCheckArgs, IHealthCheckResponse } from './HealthCheckCommand';
import { IRegisterWebAppArgs, IRegisterWebAppResponse, RegisterWebApp } from './RegisterWebAppCommand';
import { ISqlArgs, ISqlResponse, Sql } from './SqlCommand';

export class Clio {
	private readonly executor : ClioExecutor = new ClioExecutor();
	
	/**
	 * Command abstraction to flush redis db
	 * - See _clear redis database_ {@link https://github.com/Advance-Technologies-Foundation/clio/blob/master/README.md#clear-redis-database **documentation**}
	 */
	public readonly flushDb: ICommand<IFlushDbArgs,IFlushDbResponse> = new FlushDb(this.executor);
	
	/**
	 * Command abstraction to execute sql scripts
	 * - See _clio sql_ {@link https://github.com/Advance-Technologies-Foundation/clio/blob/master/README.md#execute-custom-sql-script **documentation**}
	 */
	public readonly sql: ICommand<ISqlArgs, ISqlResponse> = new Sql(this.executor);
	
	/**
	 * Command abstraction to execute health check
	 * - See _clio healthcheck_ {@link https://github.com/Advance-Technologies-Foundation/clio/blob/master/README.md#healthcheck **documentation**}
	 */
	public readonly healthCheck: ICommand<IHealthCheckArgs, IHealthCheckResponse> = new HealthCheck(this.executor);



	//#region Environment settings
	
	/**
	 * Command abstraction to create/update an environment
	 * - See _clio create/update an environment_ {@link https://github.com/Advance-Technologies-Foundation/clio/blob/master/README.md#createupdate-an-environment **documentation**}
	 */
	public readonly registerWebApp : ICommand<IRegisterWebAppArgs, IRegisterWebAppResponse> = new RegisterWebApp(this.executor);


	/**
	 * Command abstraction to delete an environment
	 * - See _clio delete an existing environment_ {@link https://github.com/Advance-Technologies-Foundation/clio/blob/master/README.md#delete-the-existing-environment **documentation**}
	 */
	//public readonly unregisterWebApp : ICommand<ICommandArgs, ICommandResponse> = new UnregisterWebApp(this.executor);
	

	/**
	 * Command abstraction to show application opetions
	 * - See _clio open application_ {@link https://github.com/Advance-Technologies-Foundation/clio/blob/master/README.md#view-application-options **documentation**}
	 */
	//public readonly showWebAppList : ICommand<ICommandArgs, ICommandResponse> = new ShowWebAppList(this.executor);

	
	//#endregion

	
	/**
	 * Command abstraction to open a Creation instance in a browser
	 * - See _clio open application_ {@link https://github.com/Advance-Technologies-Foundation/clio/blob/master/README.md#open-application **documentation**}
	 */
	//public readonly openWebApp : ICommand<ICommandArgs, ICommandResponse> = new OpenWebApp(this.executor);
	
}