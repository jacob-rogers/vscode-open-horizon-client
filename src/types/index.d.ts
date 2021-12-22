/* eslint-disable @typescript-eslint/naming-convention */
export const enum NodeType {
  CLUSTER = 'cluster',
  ORG = 'org',
  SERVICE = 'service',
  NODE = 'node',
  PATTERN = 'pattern',
  POLICY = 'policy',
}

export const enum NodeStatus {
  RUNNING = 'running',
  STOPPED = 'stopped',
}

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

interface ClusterOrg {
  id: string;
  userAuth: string;
}

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

export type ServiceGroup = 'arch' | 'url' | 'version' | 'none';

export interface ServiceMetadata {
  arch: string;
  version: string;
  url: string;
}
