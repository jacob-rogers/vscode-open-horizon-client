import { AxiosError } from 'axios';
import { URL } from 'url';
import { TreeItem, TreeItemCollapsibleState } from 'vscode';
import { AuthData } from '../auth';
import { httpClient } from '../http';
import { NodeItem } from './NodeItem';
import { PatternItem } from './PatternItem';
import { PolicyItem } from './PolicyItem';
import { ServiceItem } from './ServiceItem';
import { ITreeNode } from './TreeNode';


export type NodeType = 'service' | 'node' | 'pattern' | 'policy';

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
          const servicesPerOrg = new Map<string, Array<string>>();
          Object.keys(response.data.services).forEach((service: string) => {
            const [ nodeOrgId, serviceName ] = service.split('/', 2);
            if (servicesPerOrg.has(nodeOrgId)) {
              servicesPerOrg.set(
                nodeOrgId,
                (servicesPerOrg.get(nodeOrgId) as string[]).concat(serviceName),
              );
            } else {
              servicesPerOrg.set(nodeOrgId, [serviceName]);
            }
          });

          for (let org of servicesPerOrg.keys()) {
            const orgLabel = `${org} (organization)`;
            children.push(
              new ServiceItem(this._authData, orgLabel, servicesPerOrg.get(org)),
            );
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
          const nodesPerOrg = new Map<string, Array<string>>();
          Object.keys(response.data.nodes).forEach((node: string) => {
            const [ nodeOrgId, nodeName ] = node.split('/', 2);
            if (nodesPerOrg.has(nodeOrgId)) {
              nodesPerOrg.set(
                nodeOrgId,
                (nodesPerOrg.get(nodeOrgId) as string[]).concat(nodeName),
              );
            } else {
              nodesPerOrg.set(nodeOrgId, [nodeName]);
            }
          });

          for (let org of nodesPerOrg.keys()) {
            const orgLabel = `${org} (organization)`;
            children.push(
              new NodeItem(this._authData, orgLabel, nodesPerOrg.get(org)),
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
          const patternsPerOrg = new Map<string, Array<string>>();
          Object.keys(response.data.patterns).forEach((pattern: string) => {
            const [ patternOrgId, patternName ] = pattern.split('/', 2);
            if (patternsPerOrg.has(patternOrgId)) {
              patternsPerOrg.set(
                patternOrgId,
                (patternsPerOrg.get(patternOrgId) as string[]).concat(patternName),
              );
            } else {
              patternsPerOrg.set(patternOrgId, [patternName]);
            }
          });

          for (let org of patternsPerOrg.keys()) {
            const orgLabel = `${org} (organization)`;
            children.push(
              new PatternItem(this._authData, orgLabel, patternsPerOrg.get(org)),
            );
          }
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
          const policiesPerOrg = new Map<string, Array<string>>();
          Object.keys(response.data.businessPolicy).forEach((policy: string) => {
            const [ policyOrgId, policyName ] = policy.split('/', 2);
            if (policiesPerOrg.has(policyOrgId)) {
              policiesPerOrg.set(
                policyOrgId,
                (policiesPerOrg.get(policyOrgId) as string[]).concat(policyName),
              );
            } else {
              policiesPerOrg.set(policyOrgId, [policyName]);
            }
          });

          for (let org of policiesPerOrg.keys()) {
            const orgLabel = `${org} (organization)`;
            children.push(
              new PolicyItem(this._authData, orgLabel, policiesPerOrg.get(org)),
            );
          }
        })
        .catch((response: AxiosError) => {
          console.log('axios.error.response', response.toJSON());
        });
    }

    return Promise.resolve(children);
  }
}