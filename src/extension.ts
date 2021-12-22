import * as fs from 'fs';
import { v5 as uuidv5 } from 'uuid';
import * as vscode from 'vscode';

import Config, { updateOrg } from './config';
import { ext } from './extensionVariables';
import { HorizonObjectDecorationProvider } from './providers/HorizonObjectDecorationProvider';
import { HorizonResourceVFSProvider } from './providers/HorizonResourceVFSProvider';
import { HorizonTreeDataProvider } from './providers/HorizonTreeDataProvider';
import { ClusterAccount, HorizonEnvvars } from './types';
import ui, { SetupOption, setupOptionItems } from './uiConstants';
import { initExtVariables } from './utils';


const extName = 'open-horizon-client';

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
  const horizonDataProvider = new HorizonTreeDataProvider(context);
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
      key === ui.inputs.clusterAccount.name.key &&
      Config.getInstance().clusterAccounts.some((ca) => ca.name === value)
    ) {
      return 'Such name is already used. Please specify another one.';
    }
  }

  return value === '' ? 'Field is required' : null;
}

interface SetupOptionItem extends vscode.QuickPickItem {
  id: SetupOption;
};

async function addClusterAccount(): Promise<string | undefined> {
  const disposables: vscode.Disposable[] = [];

  let setupOptionSelected: SetupOption | undefined;
  try {
    setupOptionSelected = await new Promise<SetupOption | undefined>((resolve, _) => {
      const input = vscode.window.createQuickPick<SetupOptionItem>();
      input.title = ui.quickPicks.clusterAccount.setupOptions.title;
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
    !(Object.values(SetupOption).includes(setupOptionSelected as SetupOption))) {
    return Promise.resolve(undefined);
  }

  return new Promise<string | undefined>(async (resolve, reject) => {
    if (setupOptionSelected === SetupOption.INTERACTIVE) {
      const clusterExchangeURL = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        title: ui.inputs.clusterAccount.exchangeURL.title,
        placeHolder: ui.inputs.clusterAccount.exchangeURL.placeholder,
        validateInput: (text) => {
          return validateConfigUserInput(ui.inputs.clusterAccount.exchangeURL.key, text);
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
          title: ui.quickPicks.clusterAccount.overwrite.title,
        });
        if (!answer || answer === 'No') {
          return reject(undefined);
        }
      }

      const clusterName = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        title: ui.inputs.clusterAccount.name.title,
        placeHolder: ui.inputs.clusterAccount.name.placeholder,
        validateInput: (text) => {
          return validateConfigUserInput(ui.inputs.clusterAccount.name.key, text, true);
        },
      });
      if (!clusterName) {
        return reject(undefined);
      }

      const clusterDescription = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        title: ui.inputs.clusterAccount.description.title,
        placeHolder: ui.inputs.clusterAccount.description.placeholder,
      });

      const clusterOrgId = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        title: ui.inputs.clusterAccount.orgId.title,
        placeHolder: ui.inputs.clusterAccount.orgId.placeholder,
        validateInput: (text) => {
          return validateConfigUserInput(ui.inputs.clusterAccount.orgId.key, text);
        },
      });
      if (!clusterOrgId) {
        return reject(undefined);
      }

      const clusterCssURL = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        title: ui.inputs.clusterAccount.cssURL.title,
        placeHolder: ui.inputs.clusterAccount.cssURL.placeholder,
        validateInput: (text) => {
          return validateConfigUserInput(ui.inputs.clusterAccount.cssURL.key, text);
        },
      });
      if (!clusterCssURL) {
        return reject(undefined);
      }

      const clusterAgbotURL = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        title: ui.inputs.clusterAccount.agbotURL.title,
        placeHolder: ui.inputs.clusterAccount.agbotURL.placeholder,
      });

      const clusterExchangeUserAuth = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        title: ui.inputs.clusterAccount.exchangeUserAuth.title,
        placeHolder: ui.inputs.clusterAccount.exchangeUserAuth.placeholder,
        password: true,
        validateInput: (text) => {
          return validateConfigUserInput(ui.inputs.clusterAccount.exchangeUserAuth.key, text);
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

    } else if (setupOptionSelected === SetupOption.FILE) {
      const fileUri = await vscode.window.showOpenDialog({
        canSelectFolders: false,
        canSelectMany: false,
        title: ui.openDialogs.clusterAccount.uploadEnvFile.title,
        openLabel: ui.openDialogs.clusterAccount.uploadEnvFile.openLabel,
      });

      if (fileUri) {
        const envFileEntries = fs.readFileSync(fileUri[0].fsPath).toString().split('\n');

        const partialClusterAccount: Partial<ClusterAccount> = {};
        const orgs = [{ id: '', userAuth: '' }];
        for (const env of envFileEntries) {
          if (env.trim().startsWith('#')) { continue; }
          const [envKey, envVal] = env.split('=', 2);

          switch (envKey) {
            case HorizonEnvvars.HZN_ORG_ID:
              orgs[0].id = envVal;
              break;
            case HorizonEnvvars.HZN_EXCHANGE_USER_AUTH:
              orgs[0].userAuth = envVal;
              break;
            case HorizonEnvvars.HZN_EXCHANGE_URL:
              partialClusterAccount.exchangeURL = envVal;
              break;
            case HorizonEnvvars.HZN_FSS_CSSURL:
              partialClusterAccount.cssURL = envVal;
              break;
            case HorizonEnvvars.HZN_AGBOT_URL:
              partialClusterAccount.agbotURL = envVal;
              break;
            case HorizonEnvvars.HZN_MGMT_HUB_CERT_PATH:
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
            title: ui.quickPicks.clusterAccount.overwrite.title,
          });
          if (!answer || answer === 'No') {
            return reject(undefined);
          }
        }

        const clusterName = await vscode.window.showInputBox({
          ignoreFocusOut: true,
          title: ui.inputs.clusterAccount.name.title,
          placeHolder: ui.inputs.clusterAccount.name.placeholder,
          value: existingClusterAccount?.name,
          validateInput: (text) => {
            return validateConfigUserInput(ui.inputs.clusterAccount.name.key, text);
          },
        });
        if (!clusterName) {
          return reject(undefined);
        }

        const clusterDescription = await vscode.window.showInputBox({
          ignoreFocusOut: true,
          title: ui.inputs.clusterAccount.description.title,
          placeHolder: ui.inputs.clusterAccount.description.placeholder,
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