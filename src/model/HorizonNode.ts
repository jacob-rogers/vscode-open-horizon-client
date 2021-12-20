import { AxiosError } from 'axios';
import { TreeItem, TreeItemCollapsibleState, window } from 'vscode';

import { AuthData } from '../auth';
import {
  getApiNodesUrl, getApiPatternsUrl,
  getApiPoliciesUrl, getApiServicesUrl, httpClient,
} from '../http';
import { DeviceNode } from './DeviceNode';
import { PatternItem } from './PatternItem';
import { PolicyItem } from './PolicyItem';
import { ServiceItem } from './ServiceItem';
import { ITreeNode } from './TreeNode';
import { NodeMetadata, NodeType, ServiceMetadata } from './types';

export class HorizonNode implements ITreeNode {
  private readonly _label: string;
  private readonly _type: NodeType;

  constructor(
    private readonly _authData: AuthData,
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
    const client = httpClient(this._authData);

    switch (this._type) {
      case NodeType.SERVICE:
        const servicesUrl = getApiServicesUrl(this._authData);

        await client.get(servicesUrl)
          .then((response) => {
            const services = new Map<string, ServiceMetadata[]>();

            Object.entries(response.data.services).forEach(([name, meta]: any) => {
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
              children.push(new ServiceItem(this._authData, serviceName, serviceMetadataList, 'url'));
            }
          })
          .catch((response: AxiosError) => {
            console.log('axios.error.response', response.toJSON());
          });
        break;
      case NodeType.NODE:
        const nodesUrl = getApiNodesUrl(this._authData);

        await client.get(nodesUrl)
          .then((response) => {
            const nodes = new Map<string, NodeMetadata>();

            Object.entries(response.data.nodes).forEach(([name, meta]: any) => {
              nodes.set(name, meta);
            });

            for (const [nodeName, nodeMetadata] of nodes) {
              children.push(
                new DeviceNode(this._authData, nodeName, nodeMetadata),
              );
            }
          })
          .catch((response: AxiosError) => {
            console.log('axios.error.response', response.toJSON());
          });
        break;
      case NodeType.PATTERN:
        const patternsUrl = getApiPatternsUrl(this._authData);

        await client.get(patternsUrl)
          .then((response) => {
            Object.keys(response.data.patterns).forEach((pattern: string) => {
              const [, patternName] = pattern.split('/', 2);
              children.push(new PatternItem(this._authData, patternName));
            });
          })
          .catch((response: AxiosError) => {
            console.log('axios.error.response', response.toJSON());
          });
        break;
      case NodeType.POLICY:
        const policiesUrl = getApiPoliciesUrl(this._authData);

        await client.get(policiesUrl)
          .then((response) => {
            Object.keys(response.data.businessPolicy).forEach((policy: string) => {
              const [, policyName] = policy.split('/', 2);
              children.push(new PolicyItem(this._authData, policyName));
            });
          })
          .catch((response: AxiosError) => {
            console.log('axios.error.response', response.toJSON());
          });
        break;
      default:
        window.showErrorMessage(`Unknown node type: ${this._type}`);
        return Promise.reject();
    }

    return Promise.resolve(children);
  }
}