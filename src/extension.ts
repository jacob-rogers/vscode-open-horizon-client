// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { ext } from './extensionVariables';

function initExtVariables(context: vscode.ExtensionContext): void {
	ext.context = context;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Init extension variables first
	initExtVariables(context);
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "open-horizon-client" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposableHello = vscode.commands.registerCommand('open-horizon-client.helloOpenHorizonWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello VS Code');
	});

	let disposableCurrentTime = vscode.commands.registerCommand('open-horizon-client.showCurrentTime', () => {
		const date = new Date();
		const localCurrentDate = date.toLocaleDateString('ru-RU');
		const localCurrentTime = date.toLocaleTimeString('ru-RU');

		vscode.window.showWarningMessage(`Current date is ${localCurrentDate}, current time is ${localCurrentTime}`);
	});

	context.subscriptions.push(disposableHello);
	context.subscriptions.push(disposableCurrentTime);
}

// this method is called when your extension is deactivated
export function deactivate() {}
