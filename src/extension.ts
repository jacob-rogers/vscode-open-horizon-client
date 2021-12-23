import * as vscode from 'vscode';
import * as Handlers from './commands/handlers';
import Config from './config';
import { ext } from './extensionVariables';
import HorizonObjectDecorationProvider from './providers/HorizonObjectDecorationProvider';
import HorizonResourceVFSProvider from './providers/HorizonResourceVFSProvider';
import HorizonTreeDataProvider from './providers/HorizonTreeDataProvider';
import { Constants } from './util/constants';
import { initExtVariables } from './util/common';

const { ui } = Constants;
const {
  addClusterAccountHandler,
  explorerRefreshHandler,
  openResourceHandler,
  workspaceInitHandler,
} = Handlers;

const { extensionName } = ext;

export async function activate(context: vscode.ExtensionContext) {
  console.log(`Congratulations, your extension '${extensionName}' is now active!`);

  const { subscriptions } = context;

  // Init extension variables first
  initExtVariables(context);

  const config = Config.init();
  if (config.clusterAccounts.length) {
    vscode.window.showInformationMessage(`config.clusterAccounts: ${config.clusterAccounts}`);
    // vscode.commands.executeCommand('setContext', 'open-horizon-client.configHasClusterAccounts', true);
  }

  const disposables = [];

  // Virtual file system provider for opening Horizon resource definition
  // in file with R / RW modes
  const hznFs = new HorizonResourceVFSProvider();
  disposables.push(
    vscode.workspace.registerFileSystemProvider(ext.vfsScheme, hznFs, { isCaseSensitive: true }),
  );

  // Horizon tree data provider to explore cluster resources, showing at activity bar
  const horizonDataProvider = new HorizonTreeDataProvider(context);
  disposables.push(
    vscode.window.registerTreeDataProvider(ui.views.horizonTreeDataProvider.id, horizonDataProvider),
  );

  // Decoration provider for Horizon tree items
  disposables.push(new HorizonObjectDecorationProvider());

  /* Commands */
  disposables.push(vscode.commands.registerCommand(
    `${extensionName}.hznfs.workspaceInit`, workspaceInitHandler
  ));

  disposables.push(vscode.commands.registerCommand(
    `${extensionName}.openResource`, openResourceHandler
  ));

  disposables.push(vscode.commands.registerCommand(
    `${extensionName}.horizonExplorerRefresh`, () => explorerRefreshHandler(horizonDataProvider),
  ));

  disposables.push(vscode.commands.registerCommand(
    `${extensionName}.addClusterAccount`, addClusterAccountHandler
  ));

  // Finally push all disposables into context subscriptions
  disposables.forEach((sub) => {
    subscriptions.push(sub);
  });
}

// this method is called when your extension is deactivated
export function deactivate() { }
