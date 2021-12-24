// External dependencies
import * as vscode from 'vscode';
// Internal modules
import * as Handlers from './commands/handlers';
import Config from './config';
import { ext } from './extensionVariables';
import HorizonObjectDecorationProvider from './providers/HorizonObjectDecorationProvider';
import HorizonResourceVFSProvider from './providers/HorizonResourceVFSProvider';
import HorizonTreeDataProvider from './providers/HorizonTreeDataProvider';
import { initExtVariables } from './util/common';
import { Constants } from './util/constants';

// command / ui namespaces
// eslint-disable-next-line @typescript-eslint/naming-convention
const { command: { Commands }, ui } = Constants;
const {
  addClusterAccountHandler,
  explorerRefreshHandler,
  openResourceHandler,
  publishResourceHandler,
  workspaceInitHandler,
} = Handlers;

const { extensionName } = ext;

export async function activate(context: vscode.ExtensionContext) {
  console.log(`Congratulations, your extension '${extensionName}' is now active!`);

  const { subscriptions } = context;

  // Init extension variables first
  initExtVariables(context);

  Config.init(context);

  const disposables = [];

  // Virtual file system provider for opening Horizon resource definition
  // in file with R / RW modes
  const vfs = new HorizonResourceVFSProvider();
  disposables.push(
    vscode.workspace.registerFileSystemProvider(ext.vfsScheme, vfs, { isCaseSensitive: true }),
  );

  // Horizon tree data provider to explore cluster resources, showing at activity bar
  const horizonDataProvider = new HorizonTreeDataProvider(context);
  disposables.push(
    vscode.window.registerTreeDataProvider(
      ui.views.horizonTreeDataProvider.id, horizonDataProvider,
    ),
  );

  // Decoration provider for Horizon tree items
  disposables.push(new HorizonObjectDecorationProvider());

  /* Commands */
  disposables.push(vscode.commands.registerCommand(
    Commands.VFS.InitInWorkspace.id, workspaceInitHandler,
  ));

  disposables.push(vscode.commands.registerCommand(
    Commands.Resource.Open.id, openResourceHandler,
  ));

  disposables.push(vscode.commands.registerCommand(
    Commands.ExplorerRefresh.id, () => explorerRefreshHandler(horizonDataProvider),
  ));

  disposables.push(vscode.commands.registerCommand(
    Commands.ClusterAccount.Add.id, () => addClusterAccountHandler(context),
  ));

  disposables.push(vscode.commands.registerCommand(
    Commands.Resource.Publish.id, publishResourceHandler,
  ));

  // Finally push all disposables into context subscriptions
  disposables.forEach((sub) => {
    subscriptions.push(sub);
  });
}

// this method is called when your extension is deactivated
export function deactivate() { }
