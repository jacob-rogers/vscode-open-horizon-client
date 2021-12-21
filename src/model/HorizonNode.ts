import { AxiosError, AxiosResponse } from 'axios';
import { TreeItem, TreeItemCollapsibleState, window } from 'vscode';

import {
  getApiNodesUrl, getApiPatternsUrl,
  getApiPoliciesUrl, getApiServicesUrl, httpClient,
} from '../http';
import { DeviceNode } from './DeviceNode';
import { PatternItem } from './PatternItem';
import { PolicyItem } from './PolicyItem';
import { ServiceItem } from './ServiceItem';
import { ITreeNode } from './TreeNode';
import {
  ClusterAccount, HTTPServiceAccount, NodeMetadata,
  NodeType, ServiceMetadata,
} from './types';

export class HorizonNode implements ITreeNode {
  private readonly _label: string;
  private readonly _type: NodeType;

  constructor(
    private readonly _clusterAccount: ClusterAccount,
    private readonly _orgId: string,
    label: string,
    type: NodeType,
  ) {
    this._label = label;
    this._type = type;
  }

  public getTreeItem(): Promise<TreeItem> | TreeItem {
    const label = this._label;
    return {
      label,
      collapsibleState: TreeItemCollapsibleState.Collapsed,
      contextValue: `${this._type}-list`,
    };
  }

  public async getChildren(): Promise<ITreeNode[]> {
    const children: ITreeNode[] = [];

    const serviceAccount: HTTPServiceAccount = {
      baseUrl: this._clusterAccount.exchangeURL,
      orgId: this._clusterAccount.orgs.find((o) => o.id === this._orgId)?.id || '',
      userpass: this._clusterAccount.orgs.find((o) => o.id === this._orgId)?.userAuth || '',
    };
    const client = httpClient(serviceAccount);

    try {
      let response: AxiosResponse;
      switch (this._type) {
        case NodeType.SERVICE:
          const servicesUrl = getApiServicesUrl(serviceAccount);

          response = await client.get(servicesUrl);
          const services = new Map<string, ServiceMetadata[]>();

          Object.entries(response.data.services).forEach(([_, meta]: any) => {
            const serviceName = (meta as ServiceMetadata).url;
            if (services.has(serviceName)) {
              const oldMetaList = services.get(serviceName) as ServiceMetadata[];
              const newMetaList = [...oldMetaList, meta];
              services.set(serviceName, newMetaList);
            } else {
              services.set(serviceName, [meta]);
            }
          });

          for (const [serviceName, serviceMetadataList] of services) {
            children.push(
              new ServiceItem(
                this._clusterAccount, this._orgId,
                serviceName, serviceMetadataList, 'url',
              ),
            );
          }

          break;
        case NodeType.NODE:
          const nodesUrl = getApiNodesUrl(serviceAccount);

          response = await client.get(nodesUrl);
          const nodes = new Map<string, NodeMetadata>();

          Object.entries(response.data.nodes).forEach(([name, meta]: any) => {
            nodes.set(name, meta);
          });

          for (const [nodeName, nodeMetadata] of nodes) {
            children.push(
              new DeviceNode(this._clusterAccount, this._orgId, nodeName, nodeMetadata),
            );
          }

          break;
        case NodeType.PATTERN:
          const patternsUrl = getApiPatternsUrl(serviceAccount);

          response = await client.get(patternsUrl);
          Object.keys(response.data.patterns).forEach((pattern: string) => {
            const [, patternName] = pattern.split('/', 2);
            children.push(new PatternItem(this._clusterAccount, this._orgId, patternName));
          });

          break;
        case NodeType.POLICY:
          const policiesUrl = getApiPoliciesUrl(serviceAccount);

          response = await client.get(policiesUrl);
          Object.keys(response.data.businessPolicy).forEach((policy: string) => {
            const [, policyName] = policy.split('/', 2);
            children.push(new PolicyItem(this._clusterAccount, this._orgId, policyName));
          });

          break;
        default:
          window.showErrorMessage(`Unknown node type: ${this._type}`);
          return Promise.reject();
      }
    } catch (response: unknown) {
      if ((response as AxiosError).message) {
        window.showErrorMessage(`Cannot fetch Horizon objects of type '${this._type}': ${(response as AxiosError).message}`);
        return Promise.reject();
      }

      window.showErrorMessage(`Error: ${response}`);
      return Promise.reject();
    };

    return Promise.resolve(children);
  }
}