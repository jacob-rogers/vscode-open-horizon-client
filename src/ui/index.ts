import { v5 as uuidv5 } from 'uuid';
import { Disposable, window } from 'vscode';
import * as fs from 'fs';
import Config, { updateOrg } from '../config';
import { ClusterAccount, HorizonEnvvars, SetupOption, SetupOptionItem } from '../types';
import { Constants } from '../util/constants';

// UI namespace
const { ui } = Constants;

export async function addClusterAccount(): Promise<string | undefined> {
  const disposables: Disposable[] = [];

  let setupOptionSelected: SetupOption | undefined;
  try {
    setupOptionSelected = await new Promise<SetupOption | undefined>((resolve, _) => {
      const input = window.createQuickPick<SetupOptionItem>();
      input.title = ui.quickPicks.clusterAccount.setupOptions.title;
      input.items = ui.setupOptionItems;
      input.activeItems = [ui.setupOptionItems[0]];
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
      const clusterExchangeURL = await window.showInputBox({
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
        const answer = await window.showQuickPick(['No', 'Yes'], {
          ignoreFocusOut: true,
          title: ui.quickPicks.clusterAccount.overwrite.title,
        });
        if (!answer || answer === 'No') {
          return reject(undefined);
        }
      }

      const clusterName = await window.showInputBox({
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

      const clusterDescription = await window.showInputBox({
        ignoreFocusOut: true,
        title: ui.inputs.clusterAccount.description.title,
        placeHolder: ui.inputs.clusterAccount.description.placeholder,
      });

      const clusterOrgId = await window.showInputBox({
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

      const clusterCssURL = await window.showInputBox({
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

      const clusterAgbotURL = await window.showInputBox({
        ignoreFocusOut: true,
        title: ui.inputs.clusterAccount.agbotURL.title,
        placeHolder: ui.inputs.clusterAccount.agbotURL.placeholder,
      });

      const clusterExchangeUserAuth = await window.showInputBox({
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
      const fileUri = await window.showOpenDialog({
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
          const answer = await window.showQuickPick(['No', 'Yes'], {
            ignoreFocusOut: true,
            title: ui.quickPicks.clusterAccount.overwrite.title,
          });
          if (!answer || answer === 'No') {
            return reject(undefined);
          }
        }

        const clusterName = await window.showInputBox({
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

        const clusterDescription = await window.showInputBox({
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
