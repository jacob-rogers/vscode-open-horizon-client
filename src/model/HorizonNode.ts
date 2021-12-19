import { AxiosError } from 'axios';
import { URL } from 'url';
import { TreeItem, TreeItemCollapsibleState } from 'vscode';
import { AuthData } from '../auth';
import { httpClient } from '../http';
import { NodeItem, NodeMetadata } from './NodeItem';
import { PatternItem } from './PatternItem';
import { PolicyItem } from './PolicyItem';
import { ServiceItem, ServiceMetadata } from './ServiceItem';
import { ITreeNode } from './TreeNode';


export type NodeType = 'cluster' | 'org' | 'service' | 'node' | 'pattern' | 'policy';

export class HorizonNode implements ITreeNode {

  private readonly _label: string;
  private readonly _type: NodeType;
  private readonly _isRoot: boolean;

  constructor(
    private readonly _authData: AuthData,
    label: string,
    type: NodeType,
    isRoot = false,
  ) {
    this._label = label;
    this._type = type;
    this._isRoot = isRoot;
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
    const { orgId, exchangeURL } = this._authData.account;

    if (this._type === 'service' && this._isRoot === true) {
      const url = new URL(
        encodeURI(`${exchangeURL}orgs/${orgId}/services`),
      ).toString();

      await client.get(url)
        .then((response) => {
          const services = new Map<string, ServiceMetadata[]>();

          Object.entries(response.data.services).forEach(([name, meta]: any) => {
            // const [ , serviceName ] = name.split('/', 2);
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
    } else if (this._type === 'node' && this._isRoot === true) {
      const url = new URL(
        encodeURI(`${exchangeURL}orgs/${orgId}/nodes`),
      ).toString();

      await client.get(url)
        .then((response) => {
          const nodes = new Map<string, NodeMetadata>();

          Object.entries(response.data.nodes).forEach(([name, meta]: any) => {
            // const [ nodeOrgId, nodeName ] = node.split('/', 2);
            nodes.set(name, meta);
          });


          for (const [nodeName, nodeMetadata] of nodes) {
            children.push(
              new NodeItem(this._authData, nodeName, nodeMetadata),
            );
          }
        })
        .catch((response: AxiosError) => {
          console.log('axios.error.response', response.toJSON());
        });
    } else if (this._type === 'pattern' && this._isRoot === true) {
      const url = new URL(
        encodeURI(`${exchangeURL}orgs/${orgId}/patterns`),
      ).toString();

      await client.get(url)
        .then((response) => {
          Object.keys(response.data.patterns).forEach((pattern: string) => {
            const [ , patternName ] = pattern.split('/', 2);
            children.push(new PatternItem(this._authData, patternName));
          });
        })
        .catch((response: AxiosError) => {
          console.log('axios.error.response', response.toJSON());
        });
    } else if (this._type === 'policy' && this._isRoot === true) {
      const url = new URL(
        encodeURI(`${exchangeURL}orgs/${orgId}/business/policies`),
      ).toString();

      await client.get(url)
        .then((response) => {
          Object.keys(response.data.businessPolicy).forEach((policy: string) => {
            const [ , policyName ] = policy.split('/', 2);
            children.push(new PolicyItem(this._authData, policyName));
          });
        })
        .catch((response: AxiosError) => {
          console.log('axios.error.response', response.toJSON());
        });
    }

    return Promise.resolve(children);
  }
}