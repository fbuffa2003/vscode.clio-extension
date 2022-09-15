// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
  const vscode = acquireVsCodeApi();
  window.addEventListener('submit', (event) => {
    let obj = {
      name: document.getElementById('cname').value,
      url: document.getElementById('url').value,
      username: document.getElementById('username').value,
      password: document.getElementById('password').value,
      maintainer: document.getElementById('maintainer').value,
      isNetCore: document.getElementById('isNetCore').checked,
      isSafe: document.getElementById('isSafe').checked,
      isDeveloperModeEnabled: document.getElementById('isDeveloperModeEnabled')
        .checked,
    };

    vscode.postMessage({
      command: 'submit',
      data: obj,
    });
  });

  // Handle messages sent from the extension to the webview
  window.addEventListener('message', (event) => {
    const message = event.data; // The json data that the extension sent
    switch (message.command) {
      case 'refactor':
        currentCount = Math.ceil(currentCount * 0.5);
        counter.textContent = `${currentCount}`;
        break;
    }
  });
}());