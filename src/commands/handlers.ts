import { commands, Uri, window, workspace } from 'vscode';
import { ext } from '../extensionVariables';
import HorizonTreeDataProvider from '../providers/HorizonTreeDataProvider';
import { addClusterAccount } from '../ui';
import { loadResource } from '../util/resources';

export function workspaceInitHandler(): void {
  workspace.updateWorkspaceFolders(
    0, 0, { uri: Uri.parse(`${ext.vfsScheme}:/`), name: ext.vfsWorkspaceFolderName });
}

export async function openResourceHandler(uri: Uri): Promise<void> {
  loadResource(uri);
}

export function explorerRefreshHandler(explorer: HorizonTreeDataProvider): void {
  explorer.refresh();
}

export async function addClusterAccountHandler(): Promise<void> {
  let clusterName: string | undefined;
  try {
    clusterName = await addClusterAccount();
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