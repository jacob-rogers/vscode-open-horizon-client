// External dependencies
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { commands, ExtensionContext, ProgressLocation, Uri, window, workspace } from 'vscode';
// Internal modules
import { ext } from '../extensionVariables';
import * as http from '../http';
import HorizonTreeDataProvider from '../providers/HorizonTreeDataProvider';
import { GetResourceDataCallbackFn, HTTPServiceAccount, NodeType, PublishResourceCallback } from '../types';
import { addClusterAccount } from '../ui';
import { loadResource } from '../util/resources';
import { Constants } from '../util/constants';
import Config from '../config';

const {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  command: { Commands },
  resourceDefFileType,
} = Constants;

export function workspaceInitHandler(): void {
  workspace.updateWorkspaceFolders(
    0, 0, { uri: Uri.parse(`${ext.vfsScheme}:/`), name: ext.vfsWorkspaceFolderName });
}

export async function openResourceHandler(sa: HTTPServiceAccount, kind: NodeType, uri: Uri): Promise<void> {
  await loadResource(sa, kind, uri);
}

export function explorerRefreshHandler(explorer: HorizonTreeDataProvider): void {
  explorer.refresh();
}

export async function addClusterAccountHandler(ctx: ExtensionContext): Promise<void> {
  let clusterName: string | undefined;
  try {
    clusterName = await addClusterAccount(ctx);
    if (!clusterName) {
      throw new Error('Invalid cluster name');
    }
  } catch (err) {
    window.showWarningMessage('Cluster account was not configured properly. Please try again.');
    return;
  }

  commands.executeCommand(`${ext.extensionName}.horizonExplorerRefresh`);
  window.showInformationMessage(
    `Cluster '${clusterName}' account configuration added successfully.`);
}

export function publishResourceHandler(): void {
  publishResource((response: PublishResourceCallback) => {
    if (response.ok) {
      window.showInformationMessage(
        `Resource '${response.resourceId}' was published successfully.`);
      return;
    }
  });
}

function publishResource(cb: (response: PublishResourceCallback) => void): void {
  getResourceData(async (...args) => {
    const [data, resourceId, resourceUri] = args;
    if (data && resourceId && resourceUri) {

      const resourceType = findResourceTypeInDef(data);

      // Unknown resource type not permitted
      if (!resourceType) {
        cb({ ok: false });
        return;
      }

      const serviceAccount = Config.getServiceAccount(Uri.parse(resourceUri));
      let httpUrl: string;
      // Resource type based selector for HTTP uri builder
      switch (resourceType) {
        case NodeType.SERVICE:
          httpUrl = http.getApiServicesUrl(
            serviceAccount, removeResourceFileExt(resourceId));
          break;
        default:
          cb({ ok: false });
          return;
      }

      const client = http.Client(serviceAccount);
      const response = await client.get(httpUrl);

      const exchangeResValue = Object.values(response.data.services)[0] as string;
      const localResValueFormatted = data;

      const exchangeResFileName = path.join(os.tmpdir(), `exchange.${resourceId}`);
      const localResFileName = path.join(os.tmpdir(), `local.${resourceId}`);

      const exchangeResValueFormatted = JSON.stringify(exchangeResValue, null, 2);
      fs.writeFileSync(exchangeResFileName, exchangeResValueFormatted);
      fs.writeFileSync(localResFileName, localResValueFormatted);

      commands.executeCommand(
        'vscode.diff',
        Uri.file(exchangeResFileName),
        Uri.file(localResFileName),
        'exchange ↔ local',
      ).then(async () => {
        await window.showInformationMessage(
          "Resource diff is opened in active editor.<br />To publish changes (right-side modified version), click on 'Publish' button",
          'Publish',
        );

        const res = await window.showInformationMessage(
          `To publish changes, click on 'Publish' button`,
          {
            detail: 'Your Exchange resource definition (on left-side) will be overwritten by your modified version (on right-side)',
            modal: true,
          },
          'Publish',
        );

        if (res === 'Publish') {
          await window.withProgress({
            location: ProgressLocation.Notification,
            cancellable: false,
            title: `Publishing a resource '${resourceId}'`,
          }, async (progress) => {
            progress.report({ increment: 0 });
            const response = await client.put(httpUrl, localResValueFormatted, {
              headers: {
                'content-type': 'application/json',
              },
            });
  
            if (response.status === 201) {
              cb({ ok: true, resourceId });
              progress.report({ increment: 100 });
              return;
            }
          });
        }

        cb({ ok: false });
        return;
      });
    }

    cb({ ok: false });
    return;
  });
}

function findResourceTypeInDef(data: string | null): string {
  if (!data) {
    return '';
  }

  try {
    const resourceData = JSON.parse(data);
    // Service type validation
    if (['arch', 'deployment', 'url'].every((prop) => Object.keys(resourceData).includes(prop))) {
      return 'service';
    }
  } catch (err) {
    window.showErrorMessage('Cannot parse a JSON data from resource file.');
    return '';
  }

  return '';
}

function getResourceData(cb: GetResourceDataCallbackFn): void {
  const editor = window.activeTextEditor;

  if (!editor) {
    window.showErrorMessage('No active editor opened.');
    cb(null, null);
    return;
  }

  const data = editor.document.getText();
  if (!data.length) {
    cb(null, null);
    return;
  }

  const resourceId = editor.document.fileName.split('/').pop() || null;
  const resourceUri = editor.document.uri.toString();

  // Unsaved doc may also be published
  if (editor.document.isDirty) {
    // Saving immediately, but maybe requires a confirm prompt
    editor.document.save().then((ok) => {
      if (!ok) {
        window.showErrorMessage('Unable to save resource file.');
        cb(null, null);
        return;
      }

      cb(editor.document.getText(), resourceId, resourceUri);
      return;
    });
  }

  cb(data, resourceId, resourceUri);
  return;
}

function removeResourceFileExt(resourceId: string): string {
  // Resource ID contains file extension, which should be removed along with point.
  // Thus, when definition type is 'json', '.json' suffix will be excluded
  return resourceId.substring(0, resourceId.length - (resourceDefFileType.length + 1));
}