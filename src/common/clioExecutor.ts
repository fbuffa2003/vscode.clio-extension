import { exec } from 'child_process';
import * as vscode from 'vscode';

/** Provides abstraction over system calls to start terminal and execute commands
 */
export class ClioExecutor {
	
	private _terminal: vscode.Terminal | undefined;
	
	private createTerminal(): vscode.Terminal {
		const clioTerminal = vscode.window.terminals.find(i=> i.name === "clio console");
		if(clioTerminal){
			this._terminal = clioTerminal;
		}else{
			this._terminal = this._terminal || vscode.window.createTerminal("clio console");
			this._terminal.show();
			vscode.window.onDidCloseTerminal((closedTerminal :vscode.Terminal) => {
				if (closedTerminal === this._terminal) {
					this._terminal.dispose();
					this._terminal = undefined;
				}
			});
		}
		return this._terminal;
	}

	private getTerminal(): vscode.Terminal {
		if (this._terminal) {
			return this._terminal;
		}
		return this.createTerminal();
	}

	private sendTextToTerminal(text: string): void {
		this.getTerminal().sendText(text);
	}

	/**
	 * Executes clio command in a terminal
	 * @param command clio command (do not include clio in the command name, for example)
	 */
	public executeCommandByTerminal(command: string) {
		const _clioPath = "clio";
		this.sendTextToTerminal(`${_clioPath} ${command}`);
	}
	
	public executeByTerminal(command: string) {
		this.sendTextToTerminal(command);
	}

	/** Executes any terminal command
	 * @param command command to execute, for example clio restart
	 * @returns promise of the reslt (aka: console text from the launched process)
	 */
	public async ExecuteClioCommand(command: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			exec(command, (error, stdout, stderr) => {
				if (error) {
					resolve((error?.message as string) || error.toString());
				}
				if (stdout) {
					resolve(stdout);
				}
				if (stderr) {
					resolve(stderr);
				}
			});
		});
	}

	/** Similar to ExecuteClioCommand however folder allows to set working folder where command will be executed
	 * @param folder Active working folder where command is to be executed from
	 * @param command command to execute
	 * @returns
	 */
	public async ExecuteTaskCommand(folder: vscode.Uri, command: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			exec(command, { cwd: folder.fsPath }, (error, stdout, stderr) => {
				if (error) {
					reject((error?.message as string) || error.toString());
				}
				if (stdout) {
					resolve(stdout);
				}
				if (stderr) {
					reject(stderr);
				}
			});
		});
	}
}