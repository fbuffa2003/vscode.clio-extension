// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
  const vscode = acquireVsCodeApi();

  window.addEventListener('click', (event)=>{
	vscode.postMessage({
		command: 'submit',
		data: event.path[0].id,
	  });
  });
}());