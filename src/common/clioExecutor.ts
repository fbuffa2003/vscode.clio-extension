import { exec } from 'child_process';
import * as vscode from 'vscode';

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

	public async ExecuteClioCommand(command: string): Promise<String>{
		
		return new Promise<string>((resolve, reject)=>{
			exec(command, (error, stdout, stderr )=>{
				if(error){
					resolve(error?.message);
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
}