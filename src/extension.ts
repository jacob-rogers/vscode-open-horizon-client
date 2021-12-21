import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';

import { AuthSettings } from './auth';
import { ext } from './extensionVariables';
import { HorizonObjectDecorationProvider } from './HorizonObjectDecorationProvider';
import { HorizonTreeDataProvider } from './HorizonTreeDataProvider';
import { HorizonResourceVFSProvider } from './HorizonResourceVFSProvider';
import Config from './config';

const extName = 'open-horizon-client';

function initExtVariables(context: vscode.ExtensionContext): void {
  ext.context = context;
  ext.hznTempFsInitialized = false;
  vscode.commands.executeCommand('setContext', 'open-horizon-client.configHasClusterAccounts', false);
}

export async function activate(context: vscode.ExtensionContext) {
  console.log(`Congratulations, your extension '${ext.extensionName}' is now active!`);

  const subscriptions = context.subscriptions;

  // Init extension variables first
  initExtVariables(context);

  // Initialize and get current instance of our Secret Storage
  AuthSettings.init(context);
  const settings = AuthSettings.instance;
  const authData = await settings.getAuthData();

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
  const horizonDataProvider = new HorizonTreeDataProvider(context, authData, hznFs);
  disposables.push(vscode.window.registerTreeDataProvider('horizonExplorer', horizonDataProvider));

  // Decoration provider for Horizon tree items
  disposables.push(new HorizonObjectDecorationProvider());

  /* Commands */
  disposables.push(vscode.commands.registerCommand(`${extName}.hznfs.workspaceInit`, _ => {
    vscode.workspace.updateWorkspaceFolders(
      0, 0, { uri: vscode.Uri.parse(`${ext.vfsScheme}:/`), name: "HznFS - Sample" });
  }));

  disposables.push(vscode.commands.registerCommand(`${extName}.openResource`,
    async (uri: vscode.Uri, id: string) => {
      loadResource(uri);
    }),
  );

  disposables.push(vscode.commands.registerCommand(`${extName}.horizonExplorerRefresh`,
    () => {
      horizonDataProvider.refresh();
    }),
  );

  disposables.push(vscode.commands.registerCommand('open-horizon-client.addClusterAccount', async () => {

    const clusterName = await vscode.window.showInputBox({
      ignoreFocusOut: true,
      title: 'Cluster name',
      placeHolder: 'e.g. "Globex Corp. cluster"',
      validateInput: text => {
        return validateConfigUserInput('cluster-name', text);
      },
    });
    if (!clusterName) {
      return vscode.window
        .showWarningMessage('Cluster account was not configured properly. Please try again.');
    }

    const clusterDescription = await vscode.window.showInputBox({
      ignoreFocusOut: true,
      title: 'Cluster description',
      placeHolder: 'e.g. "Cluster for Globex Corp. edge devices management"',
    });

    const clusterOrgId = await vscode.window.showInputBox({
      ignoreFocusOut: true,
      title: 'Cluster organization ID',
      placeHolder: 'e.g. "myorg"',
      validateInput: text => {
        return validateConfigUserInput('cluster-orgId', text);
      },
    });
    if (!clusterOrgId) {
      return vscode.window
        .showWarningMessage('Cluster account was not configured properly. Please try again.');
    }

    const clusterExchangeURL = await vscode.window.showInputBox({
      ignoreFocusOut: true,
      title: 'Cluster Exchange URL',
      placeHolder: 'e.g. "https://cluster1.mycompany.com/edge-exchange/v1/"',
      validateInput: text => {
        return validateConfigUserInput('cluster-exchangeUrl', text);
      },
    });
    if (!clusterExchangeURL) {
      return vscode.window
        .showWarningMessage('Cluster account was not configured properly. Please try again.');
    }

    const clusterCssURL = await vscode.window.showInputBox({
      ignoreFocusOut: true,
      title: 'Cluster CSS URL',
      placeHolder: 'e.g. "https://cluster1.mycompany.com/edge-css/v1/"',
      validateInput: text => {
        return validateConfigUserInput('cluster-cssUrl', text);
      },
    });
    if (!clusterCssURL) {
      return vscode.window
        .showWarningMessage('Cluster account was not configured properly. Please try again.');
    }

    const clusterAgbotURL = await vscode.window.showInputBox({
      ignoreFocusOut: true,
      title: 'Cluster Agbot URL',
      placeHolder: 'e.g. "https://cluster1.mycompany.com/edge-agbot/v1/"',
    });

    const clusterExchangeUserAuth = await vscode.window.showInputBox({
      ignoreFocusOut: true,
      title: 'Cluster Exchange user auth credentials',
      placeHolder: 'e.g. "user1:some_password"',
      password: true,
      validateInput: text => {
        return validateConfigUserInput('cluster-exchangeUserAuth', text);
      },
    });
    if (!clusterExchangeUserAuth) {
      return vscode.window
        .showWarningMessage('Cluster account was not configured properly. Please try again.');
    }

    const clusterId = uuidv4();
    Config.updateClusterAccount(clusterId, {
      id: clusterId,
      name: clusterName,
      description: clusterDescription,
      orgs: [{ id: clusterOrgId, userAuth: clusterExchangeUserAuth }],
      exchangeURL: clusterExchangeURL,
      cssURL: clusterCssURL,
    });

    vscode.commands.executeCommand(`${extName}.horizonExplorerRefresh`);
    vscode.window.showInformationMessage(`Cluster '${clusterName}' account configuration added successfully.`);
  }));

  // Finally push all disposables into context subscriptions
  disposables.forEach((sub) => {
    subscriptions.push(sub);
  });
}

// this method is called when your extension is deactivated
export function deactivate() { }

function loadResource(uri: vscode.Uri) {
  const fileType = 'json';
  const formattedUri = substituteSlashes(uri.with({ path: uri.path + `.${fileType}` }));
  vscode.workspace.openTextDocument(formattedUri)
    .then((doc) => {
      if (doc) {
        vscode.window.showTextDocument(doc);
      }
    },
      (err) => vscode.window.showErrorMessage(`Error loading document: ${err}`));
}

function substituteSlashes(uri: vscode.Uri): vscode.Uri {
  const resultUri = `${uri.scheme}:/`
    + uri.toString()
      .replace(uri.scheme + ':', '')
      .replace('/', '-');
  return vscode.Uri.parse(resultUri);
}

function validateConfigUserInput(key: string, value: string) {
  return value === '' ? `[${key}] Field is required` : null;
}