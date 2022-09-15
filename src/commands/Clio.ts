import { ClioExecutor } from '../Common/clioExecutor';
import { ICommand } from './BaseCommand';
import {FlushDb,IFlushDbArgs,IFlushDbResponse } from './FlushDbCommand';
import { ISqlArgs, ISqlResponse, Sql } from './SqlCommand';

export class Clio {
	private readonly executor : ClioExecutor = new ClioExecutor();
	public readonly flushDb: ICommand<IFlushDbArgs,IFlushDbResponse> = new FlushDb(this.executor);
	public readonly Sql: ICommand<ISqlArgs, ISqlResponse> = new Sql(this.executor);
}