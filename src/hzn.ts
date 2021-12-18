import * as vscode from 'vscode';

import { HznCLIContext } from './context';
import * as utils from './utils';

export interface HZN {
  checkLocation(): Promise<boolean>;
  path(): string;
}

class HZNImpl implements HZN {

  private readonly context: HznCLIContext;

  constructor(hznFound: boolean) {
    this.context = { found: hznFound, path: 'hzn' };
  }

  checkLocation(): Promise<boolean> {
    return checkLocation(this.context);
  }

  path(): string {
    return path(this.context.path);
  }
}

export function activateBinary(): HZN {
  return new HZNImpl(false);
}

async function checkLocation(context: HznCLIContext): Promise<boolean> {
  return await checkHZNCmdLocation(context);
}

async function checkHZNCmdLocation(context: HznCLIContext): Promise<boolean> {
  const binaryName = 'hzn';
  const config = vscode.workspace.getConfiguration('openHorizon');
  const configBinaryPath = config.get('hznCliBinaryLocation') as string;

  return await utils.checkForBinaryLocation(context, binaryName, configBinaryPath);
}

function path(basePath: string): string {
  return basePath;
}