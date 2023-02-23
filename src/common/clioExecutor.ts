import { exec } from 'child_process';
import * as vscode from 'vscode';

/** Provides abstraction over system calls to start terminal and execute commands
 */
export class ClioExecutor {
	private clioPath = 'clio';
	private terminal: vscode.Terminal | undefined;
	private isWin = process.platform === 'win32';	

    private createTerminal() : vscode.Terminal {
        this.terminal = this.terminal || vscode.window.createTerminal('clio console', this.isWin ? 'C:\\Windows\\System32\\cmd.exe' : undefined);
        this.terminal.show();
        vscode.window.onDidCloseTerminal(closedTerminal => {
			if (closedTerminal === this.terminal) {
				this.terminal = undefined;
			}
		});
        return this.terminal;
    }

    private getTerminal() : vscode.Terminal {
        if(this.terminal){
            return this.terminal;
        }
        return this.createTerminal(); 
    }

    private sendTextToTerminal(text: string) {
		let terminal = this.getTerminal();
		terminal.sendText(`${this.isWin ? '' : 'wine '}${text}`);
    }

	/**
	 * Executes clio command in a terminal
	 * @param command clio command (do not include clio in the command name, for example)
	 */
	public executeCommandByTerminal(command: string) {
		this.sendTextToTerminal(`"${this.clioPath}" ${command}`);
	}

    public executeClioCommand(command: string): String {
	    const cp = require('child_process');
	    let cmd = `${this.clioPath} ${command}`;
  
	    const proc = cp.spawnSync(cmd, {
	        shell: true,
	        encoding: 'utf8',
	    });
  
	    let procData = proc.stdout.toString();
  
	    if (proc !== null) {
	        if (proc.stdout !== null && proc.stdout.toString() !== '') {
		    procData = proc.stdout.toString();
	    }
	    if (proc.stderr !== null && proc.stderr.toString() !== '') {
    		const procErr = proc.stderr.toString;
	    	vscode.window.showInformationMessage("The '" + cmd + "' process failed: " + procErr);
    		procData = procErr;
	      }
	    }
	    return procData;
    }

	/** Executes any terminal command
	 * @param command command to execute, for example clio restart
	 * @returns promise of the reslt (aka: console text from the launched process)
	 */
	public async ExecuteClioCommand(command: string): Promise<string>{
		return new Promise<string>((resolve, reject)=>{
			exec(command, (error, stdout, stderr )=>{
				if(error){
					resolve(error?.message as string || error.toString());
				}
				if(stdout){
					resolve(stdout);
				}
				if(stderr){
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
	public async ExecuteTaskCommand(folder: vscode.Uri, command: string): Promise<string>{
		return new Promise<string>((resolve, reject)=>{

			exec(command, {cwd: folder.fsPath},(error, stdout, stderr )=>{
				if(error){
					reject(error?.message as string || error.toString());
				}
				if(stdout){
					resolve(stdout);
				}
				if(stderr){
					reject(stderr);
				}
			});
		});
	}
}