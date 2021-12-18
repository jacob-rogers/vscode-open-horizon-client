import * as fs from 'fs';
import * as path from 'path';
import * as shelljs from 'shelljs';
import * as vscode from 'vscode';

import { BinaryContext } from './context';

type Location = {
  location: string
};

type ShellExecError = {
  code: number;
  error: string;
};

interface PathError extends Error {
}

const horizonEnvFileName = 'horizon.env';

export function arrayEquals<T>(
  one: ReadonlyArray<T> | undefined,
  other: ReadonlyArray<T> | undefined,
  itemEquals: (a: T, b: T) => boolean = (a, b) => a === b): boolean {

  if (one === other) {
    return true;
  }

  if (!one || !other) {
    return false;
  }

  if (one.length !== other.length) {
    return false;
  }

  for (let i = 0, len = one.length; i < len; i++) {
    if (!itemEquals(one[i], other[i])) {
      return false;
    }
  }

  return true;
}

export async function checkForBinaryLocation(context: BinaryContext, binaryName: string, configBinaryPath?: string): Promise<boolean> {
  // Configuration has no binary path declaration, need to find its location manually
  if (!configBinaryPath) {
    const result = await findHostBinary(binaryName);

    if ((result as ShellExecError).code || (result as ShellExecError).error) {
      vscode.window.showErrorMessage(`No context binary path found for '${binaryName}': ${(result as ShellExecError).code} ${(result as ShellExecError).error}.`);
      return false;
    }

    context.found = true;
    vscode.window.showInformationMessage(`Default '${binaryName}' location found: ${(result as Location).location}.`);
    return true;
  }

  // Binary path declared in configuration, now attempting to verify actual
  // filepath exists
  context.found = fs.existsSync(configBinaryPath);

  if (context.found) {
    context.path = configBinaryPath;
  } else {
    vscode.window.showErrorMessage('Missing context binary path file');
  }

  return context.found;
}

async function findHostBinary(binaryName: string): Promise<Location | ShellExecError> {
  const cmd = `which ${binaryName}`;

  const options = {
    env: {
      HOME: process.env.HOME,
      PATH: process.env.PATH,
    },
    async: true,
  };

  return new Promise((resolve, _) => {
    shelljs.exec(cmd, options, (code, stdout, stderr) => {
      console.log(`Shell exec: ${code} -- ${stdout} -- ${stderr}`);
      if (code || stderr.length) {
        resolve({ code, error: stderr });
      }

      resolve({ location: stdout });
    });
  });
}

export function getWorkspacePath(): string | PathError {
  let workspaceFolder = vscode.workspace.workspaceFolders;

  if (workspaceFolder && workspaceFolder.length === 1) {
    return workspaceFolder[0].uri.fsPath;
  }

  return {
    name: 'PathError',
    message: 'Workspace path not found',
  } as PathError;
}

export function getHorizonEnvFilePath(): string | PathError {
  const workspacePath = getWorkspacePath();

  if ((workspacePath as PathError).name === 'PathError') {
    return workspacePath as PathError;
  }

  return workspacePath + path.sep + horizonEnvFileName;
}