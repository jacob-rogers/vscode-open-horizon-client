/* eslint-disable @typescript-eslint/naming-convention */

import { Memento, QuickPickItem } from 'vscode';

/*******************************************************************************
 * Interface types *************************************************************
 * ****************************************************************************/

export interface ClientConfiguration {
  clusterAccounts: ClusterAccount[];
}

export interface ClusterAccount {
  id: string;
  name: string;
  description?: string;
  exchangeURL: string;
  cssURL: string;
  agbotURL?: string;
  orgs: ClusterOrg[];
  serviceKeys: {
    public?: string;
    private?: string;
  }
  clusterCertPath?: string;
  agentNamespace?: string;
  isAdmin?: boolean;
}

export interface ClusterOrg {
  id: string;
  userAuth: string;
}

export interface GlobalState extends Memento { }

export interface HTTPServiceAccount {
  baseUrl: string;
  orgId: string;
  userpass: string;
}

export interface Node {
  type: NodeType;
  label: string;
  data?: any;
}

export interface NodeMetadata {
  arch: string;
  name: string;
  publicKey: string;
}

export interface ServiceMetadata {
  arch: string;
  version: string;
  url: string;
}

export interface SetupOptionItem extends QuickPickItem {
  id: SetupOption;
}

/*******************************************************************************
 * Enum types ******************************************************************
 * ****************************************************************************/

export enum ExplorerServiceGroup {
  NONE = 'none',
  ARCH = 'arch',
  URL = 'url',
  VERSION = 'version',
}

export enum NodeType {
  CLUSTER = 'cluster',
  ORG = 'org',
  SERVICE = 'service',
  NODE = 'node',
  PATTERN = 'pattern',
  POLICY = 'policy',
}

export enum NodeStatus {
  RUNNING = 'running',
  STOPPED = 'stopped',
}

export enum HorizonEnvvars {
  HZN_ORG_ID = 'HZN_ORG_ID',
  HZN_EXCHANGE_USER_AUTH = 'HZN_EXCHANGE_USER_AUTH',
  HZN_EXCHANGE_URL = 'HZN_EXCHANGE_URL',
  HZN_FSS_CSSURL = 'HZN_FSS_CSSURL',
  HZN_AGBOT_URL = 'HZN_AGBOT_URL',
  HZN_MGMT_HUB_CERT_PATH = 'HZN_MGMT_HUB_CERT_PATH',
}

export enum SetupOption {
  INTERACTIVE = 'interactive',
  FILE = 'file',
}

/*******************************************************************************
 * Error types *****************************************************************
 * ****************************************************************************/

export interface PathError extends Error { }

export interface PublishResourceCallback {
  ok: boolean;
  resourceId?: string | null;
}

/*******************************************************************************
 * Regular types ***************************************************************
 * ****************************************************************************/

export type GetResourceDataCallbackFn = (
  data: string | null,
  resourceId?: string | null,
  resourceUri?: string | null,
) => void;