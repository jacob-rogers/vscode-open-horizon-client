import { AxiosError, AxiosResponse } from 'axios';
import { ExtensionContext, TreeItem, TreeItemCollapsibleState, window } from 'vscode';
import * as http from '../http';
import {
  ClusterAccount, ClusterOrg, ExplorerServiceGroup,
  HTTPServiceAccount, NodeMetadata, NodeType, ServiceMetadata
} from '../types';
import DeviceNode from './DeviceNode';
import PatternNode from './PatternNode';
import PolicyNode from './PolicyNode';
import ServiceNode from './ServiceNode';
import ITreeNode from './TreeNode';

export default class HorizonNode implements ITreeNode {
  constructor(
    private readonly _ctx: ExtensionContext,
    private readonly _clusterAccount: ClusterAccount,
    private readonly _orgId: string,
    private readonly _label: string,
    private readonly _type: NodeType,
  ) { }

  private get label(): string {
    return this._label;
  }

  private get orgId(): string {
    return this._orgId;
  }

  private getExchangeUrl(): string {
    return this._clusterAccount.exchangeURL;
  }

  private getOrgItem(): ClusterOrg | undefined {
    return this._clusterAccount.orgs.find((org) => org.id === this.orgId);
  }

  public getTreeItem(): Promise<TreeItem> | TreeItem {
    return {
      label: this.label,
      collapsibleState: TreeItemCollapsibleState.Collapsed,
      contextValue: `${this._type}-list`,
    };
  }

  public async getChildren(): Promise<ITreeNode[]> {
    const children: ITreeNode[] = [];

    const serviceAccount: HTTPServiceAccount = {
      baseUrl: this.getExchangeUrl(),
      orgId: this.orgId,
      userpass: this.getOrgItem()?.userAuth || '',
    };
    const client = http.Client(serviceAccount);

    try {
      let response: AxiosResponse;
      switch (this._type) {
        case NodeType.SERVICE:
          const servicesUrl = http.getApiServicesUrl(serviceAccount);

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
              new ServiceNode(
                this._ctx, this._clusterAccount, this.orgId,
                serviceName, serviceMetadataList, ExplorerServiceGroup.URL,
              ),
            );
          }

          break;
        case NodeType.NODE:
          const nodesUrl = http.getApiNodesUrl(serviceAccount);

          response = await client.get(nodesUrl);
          const nodes = new Map<string, NodeMetadata>();

          Object.entries(response.data.nodes).forEach(([name, meta]: any) => {
            nodes.set(name, meta);
          });

          for (const [nodeName, nodeMetadata] of nodes) {
            children.push(
              new DeviceNode(
                this._ctx, this._clusterAccount,
                this.orgId, nodeName, nodeMetadata,
              ),
            );
          }

          break;
        case NodeType.PATTERN:
          const patternsUrl = http.getApiPatternsUrl(serviceAccount);

          response = await client.get(patternsUrl);
          Object.keys(response.data.patterns).forEach((pattern: string) => {
            const [, patternName] = pattern.split('/', 2);
            children.push(
              new PatternNode(this._ctx, this._clusterAccount, this.orgId, patternName),
            );
          });

          break;
        case NodeType.POLICY:
          const policiesUrl = http.getApiPoliciesUrl(serviceAccount);

          response = await client.get(policiesUrl);
          Object.keys(response.data.businessPolicy).forEach((policy: string) => {
            const [, policyName] = policy.split('/', 2);
            children.push(
              new PolicyNode(this._ctx, this._clusterAccount, this.orgId, policyName),
            );
          });

          break;
        default:
          window.showErrorMessage(`Unknown node type: ${this._type}`);
          return Promise.reject();
      }
    } catch (response: unknown) {
      if ((response as AxiosError).message) {
        window.showErrorMessage(
          `Cannot fetch Horizon objects of type '${this._type}': ${(response as AxiosError).message}`
        );
        return Promise.reject();
      }

      window.showErrorMessage(`Error: ${response}`);
      return Promise.reject();
    };

    return Promise.resolve(children);
  }
}