/* eslint-disable @typescript-eslint/naming-convention */
export const enum NodeType {
  CLUSTER = 'cluster',
  ORG = 'org',
  SERVICE = 'service',
  NODE = 'node',
  PATTERN = 'pattern',
  POLICY = 'policy',
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