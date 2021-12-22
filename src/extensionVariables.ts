import { ExtensionContext } from 'vscode';

/**
 * Namespace for common variables used throughout the extension.
 * They must be initialized in the activate() method of extension.ts
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ext {
  export let context: ExtensionContext;

  export let hznServicesRoot: unknown;
  export let hznNodesRoot: unknown;
  export let hznPatternsRoot: unknown;
  export let hznPoliciesRoot: unknown;

  export let hznTempFsInitialized: boolean;

  export const extensionName: string = 'open-horizon-client';
  export const vfsScheme: string = 'hzn';
}