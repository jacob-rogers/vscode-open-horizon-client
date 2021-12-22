import * as fs from 'fs';
import { v5 as uuidv5 } from 'uuid';
import * as vscode from 'vscode';

import Config, { updateOrg } from './config';
import { ext } from './extensionVariables';
import { HorizonObjectDecorationProvider } from './HorizonObjectDecorationProvider';
import { HorizonResourceVFSProvider } from './HorizonResourceVFSProvider';
import { HorizonTreeDataProvider } from './HorizonTreeDataProvider';
import { ClusterAccount } from './types';


const extName = 'open-horizon-client';

const setupOptionItems = [
  {
    id: 'interactive-setup',
    label: 'Set up Cluster Account props using interactive inputs',
    detail: `Shows step-by-step user input boxes`,
  },
  {
    id: 'file-setup',
    label: 'Load from .env file',
    detail: `Shows an open file dialog, accepts a file with env vars in key=value format`,
  },
];

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
  const horizonDataProvider = new HorizonTreeDataProvider(context, hznFs);
  disposables.push(vscode.window.registerTreeDataProvider('horizonExplorer', horizonDataProvider));

  // Decoration provider for Horizon tree items
  disposables.push(new HorizonObjectDecorationProvider());

  /* Commands */
  disposables.push(vscode.commands.registerCommand(`${extName}.hznfs.workspaceInit`, _ => {
    vscode.workspace.updateWorkspaceFolders(
      0, 0, { uri: vscode.Uri.parse(`${ext.vfsScheme}:/`), name: 'Horizon virtual file system' });
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
    let clusterName: string | undefined;
    
    try {
      clusterName = await addClusterAccount();
      if (!clusterName) {
        throw new Error('Invalid cluster name');
      }
    } catch (err) {
      return vscode.window
        .showWarningMessage('Cluster account was not configured properly. Please try again.');
    }

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

function validateConfigUserInput(key: string, value: string, checkForDuplicates?: boolean) {
  if (checkForDuplicates) {
    if (
      key === 'cluster-name' &&
      Config.getInstance().clusterAccounts.some((ca) => ca.name === value)
    ) {
      return 'Such name is already used. Please specify another one.';
    }
  }

  return value === '' ? `[${key}] Field is required` : null;
}

interface SetupOption extends vscode.QuickPickItem {
  id: string;
};

async function addClusterAccount(): Promise<string | undefined> {
  const disposables: vscode.Disposable[] = [];

  let setupOptionSelected: string | undefined;
  try {
    setupOptionSelected = await new Promise<string | undefined>((resolve, _) => {
      const input = vscode.window.createQuickPick<SetupOption>();
      input.title = 'Cluster Account setup options';
      input.items = setupOptionItems;
      input.activeItems = [setupOptionItems[0]];
      input.ignoreFocusOut = true;

      disposables.push(
        input.onDidChangeSelection((items) => {
          resolve(items[0].id);
          input.hide();
        }),
        input.onDidHide(() => {
          resolve(undefined);
          input.dispose();
        })
      );

      input.show();
    });
  } finally {
    disposables.forEach((d) => d.dispose());
  }

  // If cancelled or inivalid option selected, break and return nothing
  if (!setupOptionSelected ||
    !['interactive-setup', 'file-setup'].includes(setupOptionSelected)) {
    return Promise.resolve(undefined);
  }

  return new Promise<string | undefined>(async (resolve, reject) => {
    if (setupOptionSelected === 'interactive-setup') {
      const clusterExchangeURL = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        title: 'Cluster Exchange URL',
        placeHolder: 'e.g. "https://cluster1.mycompany.com/edge-exchange/v1/"',
        validateInput: (text) => {
          return validateConfigUserInput('cluster-exchangeUrl', text);
        },
      });
      if (!clusterExchangeURL) {
        return reject(undefined);
      }

      const clusterId = uuidv5(clusterExchangeURL, uuidv5.URL);
      // Check if cluster account wiith such Exchange URL already exists, and
      // ask user to overwrite it or skip configuration process
      const existingClusterAccount = Config.get<ClusterAccount>(clusterId);
      if (existingClusterAccount) {
        const answer = await vscode.window.showQuickPick(['No', 'Yes'], {
          ignoreFocusOut: true,
          title: 'Cluster Account for specified Exchange URL is already configured. Rewrite?',
        });
        if (!answer || answer === 'No') {
          return reject(undefined);
        }
      }

      const clusterName = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        title: 'Cluster name',
        placeHolder: 'e.g. "Globex Corp. cluster"',
        validateInput: (text) => {
          return validateConfigUserInput('cluster-name', text, true);
        },
      });
      if (!clusterName) {
        return reject(undefined);
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
        validateInput: (text) => {
          return validateConfigUserInput('cluster-orgId', text);
        },
      });
      if (!clusterOrgId) {
        return reject(undefined);
      }

      const clusterCssURL = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        title: 'Cluster CSS URL',
        placeHolder: 'e.g. "https://cluster1.mycompany.com/edge-css/v1/"',
        validateInput: (text) => {
          return validateConfigUserInput('cluster-cssUrl', text);
        },
      });
      if (!clusterCssURL) {
        return reject(undefined);
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
        validateInput: (text) => {
          return validateConfigUserInput('cluster-exchangeUserAuth', text);
        },
      });
      if (!clusterExchangeUserAuth) {
        return reject(undefined);
      }

      Config.updateClusterAccount(clusterId, {
        id: clusterId,
        name: clusterName,
        description: clusterDescription,
        orgs: [{ id: clusterOrgId, userAuth: clusterExchangeUserAuth }],
        exchangeURL: clusterExchangeURL,
        cssURL: clusterCssURL,
        agbotURL: clusterAgbotURL,
      });

      return resolve(clusterName);

    } else if (setupOptionSelected === 'file-setup') {
      const fileUri = await vscode.window.showOpenDialog({
        canSelectFolders: false,
        canSelectMany: false,
        title: 'Upload a file with env variables for Cluster Account setup',
        openLabel: 'Add env file',
      });

      if (fileUri) {
        const envFileEntries = fs.readFileSync(fileUri[0].fsPath).toString().split('\n');

        const partialClusterAccount: Partial<ClusterAccount> = {};
        const orgs = [{ id: '', userAuth: '' }];
        for (const env of envFileEntries) {
          if (env.trim().startsWith('#')) { continue; }
          const [envKey, envVal] = env.split('=', 2);

          switch (envKey) {
            case 'HZN_ORG_ID':
              orgs[0].id = envVal;
              break;
            case 'HZN_EXCHANGE_USER_AUTH':
              orgs[0].userAuth = envVal;
              break;
            case 'HZN_EXCHANGE_URL':
              partialClusterAccount.exchangeURL = envVal;
              break;
            case 'HZN_FSS_CSSURL':
              partialClusterAccount.cssURL = envVal;
              break;
            case 'HZN_AGBOT_URL':
              partialClusterAccount.agbotURL = envVal;
              break;
            case 'HZN_MGMT_HUB_CERT_PATH':
              partialClusterAccount.clusterCertPath = envVal;
              break;
            default:
              continue;
          }
        }

        const clusterId = uuidv5(partialClusterAccount.exchangeURL || '', uuidv5.URL);
        // Check if cluster account with such Exchange URL already exists, and
        // ask user to overwrite it or skip configuration process
        const existingClusterAccount = Config.get<ClusterAccount>(clusterId);
        if (existingClusterAccount) {
          const answer = await vscode.window.showQuickPick(['No', 'Yes'], {
            ignoreFocusOut: true,
            title: 'Cluster Account for specified Exchange URL is already configured. Rewrite?',
            onDidSelectItem: (item) => console.log(item),
          });
          if (!answer || answer === 'No') {
            console.log(`I am here, answer is ${answer}`);
            return reject(undefined);
          }
        }

        const clusterName = await vscode.window.showInputBox({
          ignoreFocusOut: true,
          title: 'Cluster name',
          placeHolder: 'e.g. "Globex Corp. cluster"',
          value: existingClusterAccount?.name,
          validateInput: (text) => {
            return validateConfigUserInput('cluster-name', text);
          },
        });
        if (!clusterName) {
          return reject(undefined);
        }

        const clusterDescription = await vscode.window.showInputBox({
          ignoreFocusOut: true,
          title: 'Cluster description',
          placeHolder: 'e.g. "Cluster for Globex Corp. edge devices management"',
          value: existingClusterAccount?.description,
        });

        const newOrg = orgs[0];
        Config.updateClusterAccount(clusterId, {
          id: clusterId,
          name: clusterName,
          description: clusterDescription,
          orgs: updateOrg(clusterId, newOrg),
          exchangeURL: partialClusterAccount.exchangeURL || '',
          cssURL: partialClusterAccount.cssURL || '',
          agbotURL: partialClusterAccount.agbotURL || '',
        });

        return resolve(clusterName);
      }
    }
  });
}