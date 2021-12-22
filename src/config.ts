import * as vscode from 'vscode';

import { ClientConfiguration, ClusterAccount, ClusterOrg } from './types';

const clusterAccountDefaultProps: Partial<ClusterAccount> = {
  serviceKeys: {
    public: '$HOME/.hzn/keys/service.public.pem',
    private: '$HOME/.hzn/keys/service.private.key',
  },
  clusterCertPath: '',
  isAdmin: false,
};

export default class Config implements vscode.Memento, ClientConfiguration {
  private static _instance: ClientConfiguration;
  clusterAccounts: ClusterAccount[];

  constructor() {
    this.clusterAccounts = [];
  }

  static get instance(): ClientConfiguration {
    return Config._instance;
  }

  keys(): readonly string[] {
    // no-op
    throw new Error('Method not implemented.');
  }

  get<T>(key: string): T | undefined;
  get<T>(key: string, defaultValue: T): T;
  get(key: any, defaultValue?: any): ClusterAccount | undefined {
    // no-op
    throw new Error('Method not implemented.');
  }

  update(key: string, value: any): Thenable<void> {
    // no-op
    throw new Error('Method not implemented.');
  }

  /**
   * Method for iterating over a list of Cluster Account object IDs.
   * @returns a list of Cluster Account object IDs
   */
  private static keys(): readonly string[] {
    return Config._instance.clusterAccounts.map(ca => ca.id);
  }

  /**
   * Method for retrieving a Cluster Account object by its ID.
   * @param key Cluster Account object ID (string value)
   * @param defaultValue Default Cluster Account object, if no existing object with such ID in storage
   * @default ClusterAccount
   * @returns Cluster Account object or undefined if not found by ID
   */
  static get<ClusterAccount>(key: string): ClusterAccount | undefined;
  static get<ClusterAccount>(key: string, defaultValue: ClusterAccount): ClusterAccount;
  static get(key: any, defaultValue?: any): ClusterAccount | undefined {
    if (Config.keys().includes(key)) {
      return Config.getInstance().clusterAccounts.find((ca) => ca.id === key);
    } else if (defaultValue) {
      return defaultValue;
    }

    return undefined;
  }

  /**
   * Method for storing a Cluster Account object with its ID as key.
   * @param key Cluster Account object ID (string value)
   * @param value New Cluster Account object value or its partial (will be merged with existing one)
   */
  static update(key: string, value: any): Thenable<void> {
    const clusterAccountIdx =
      Config._instance.clusterAccounts.findIndex((ca) => ca.id === key);

    if (clusterAccountIdx >= 0) {
      Config._instance.clusterAccounts[clusterAccountIdx] = value;
    } else {
      Config._instance.clusterAccounts.push({
        ...value,
        ...clusterAccountDefaultProps,
      });
    }

    return Promise.resolve();
  }

  static init(): ClientConfiguration {
    if (!Config.getInstance()) {
      Config._instance = new Config();
      Config._instance.clusterAccounts = [];
      return Config._instance;
    }

    return Config._instance;
  }

  static getInstance(): ClientConfiguration {
    return Config._instance;
  }

  static updateClusterAccount(
    clusterId: string,
    clusterAccountPartial: ClusterAccount | Partial<ClusterAccount>): void {
    const ca = Config.get<ClusterAccount>(clusterId);
    if (ca) {
      // Write only a partial update, if cluster account exists
      Config.update(clusterId, Object.assign({}, ca, clusterAccountPartial));
    } else {
      Config.update(clusterId, Object.assign({}, clusterAccountPartial));
    }
  }
}

export function updateOrg(clusterId: string, newOrg: ClusterOrg): ClusterOrg[] {
  const currentClusterAccount = Config.get<ClusterAccount>(clusterId);

  if (currentClusterAccount) {
    const newOrgs = [...currentClusterAccount.orgs];
    const orgIdIdx = newOrgs.findIndex((org) => org.id === newOrg.id);
    if (orgIdIdx >= 0) {
      newOrgs[orgIdIdx] = newOrg;
      return newOrgs;
    } else {
      newOrgs.push(newOrg);
      return newOrgs;
    }
  }

  return [newOrg];
}