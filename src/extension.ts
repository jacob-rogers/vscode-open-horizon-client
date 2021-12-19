import * as vscode from 'vscode';

import { AuthSettings } from './auth';
import { ext } from './extensionVariables';
import { HorizonObjectDecorationProvider } from './HorizonObjectDecorationProvider';
import { HorizonTreeDataProvider } from './HorizonTreeDataProvider';
import { activateBinary } from './hzn';

const hzn = activateBinary();
const extName = 'open-horizon-client';

function initExtVariables(context: vscode.ExtensionContext): void {
	ext.context = context;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	console.log(`Congratulations, your extension "${extName}" is now active!`);

	const subscriptions = context.subscriptions;

	// Check whether hzn cli is installed
	hzn.checkLocation();

	// Init extension variables first
	initExtVariables(context);

	// Initialize and get current instance of our Secret Storage
	AuthSettings.init(context);
	const settings = AuthSettings.instance;
	const authData = await settings.getAuthData();

	const horizonDataProvider = new HorizonTreeDataProvider(context, authData);

	const disposables = [];
	disposables.push(vscode.window.registerTreeDataProvider('horizonExplorer', horizonDataProvider));

	disposables.push(new HorizonObjectDecorationProvider());

	disposables.forEach((sub) => {
		subscriptions.push(sub);
	});
}

// this method is called when your extension is deactivated
export function deactivate() { }
