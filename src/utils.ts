import * as path from 'path';
import { commands, ExtensionContext, workspace } from 'vscode';

import { ext } from './extensionVariables';
import { PathError } from './types';

export function getWorkspacePath(): string | PathError {
  let workspaceFolder = workspace.workspaceFolders;

  if (workspaceFolder && workspaceFolder.length === 1) {
    return workspaceFolder[0].uri.fsPath;
  }

  return {
    name: 'PathError',
    message: 'Workspace path not found',
  } as PathError;
}

export function getResourceImagePath(ctx: ExtensionContext, imageFileName: string): string {
  return path.join(getExtensionPath(ctx), 'resources', imageFileName);
}

export function getExtensionPath(context: ExtensionContext): string {
  return context.extensionPath;
}

export function initExtVariables(context: ExtensionContext): void {
  ext.context = context;
  ext.hznTempFsInitialized = false;
  commands.executeCommand('setContext', 'open-horizon-client.configHasClusterAccounts', false);
}
