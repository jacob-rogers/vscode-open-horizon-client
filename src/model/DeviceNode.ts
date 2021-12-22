import { ExtensionContext, TreeItem, TreeItemCollapsibleState } from 'vscode';

import { ClusterAccount, NodeMetadata, NodeStatus, NodeType } from '../types';
import { getNodeResourceURI } from '../uris';
import { getResourceImagePath } from '../utils';
import { ITreeNode } from './TreeNode';

export default class DeviceNode implements ITreeNode {
  private readonly _type: NodeType = NodeType.NODE;

  constructor(
    private readonly _ctx: ExtensionContext,
    private readonly _clusterAccount: ClusterAccount,
    private readonly _orgId: string,
    private readonly _label: string,
    private readonly _metadata: NodeMetadata,
  ) { }

  private getExchangeUrl(): string {
    return this._clusterAccount.exchangeURL;
  }

  private get label(): string {
    return this._label.startsWith(this._orgId)
      ? this._label.split('/', 2)[1]
      : this._label;
  }

  private get orgId(): string {
    return this._orgId;
  }

  private getNodeStatus(): NodeStatus {
    return this._metadata.publicKey.length ? NodeStatus.RUNNING : NodeStatus.STOPPED;
  }

  private getTreeItemDescription(): string {
    const { arch, publicKey } = this._metadata;
    return publicKey.length ? `${arch} -- running` : `${arch} -- not running`;
  }

  public getTreeItem(): TreeItem | Promise<TreeItem> {
    let resourceUri = getNodeResourceURI(this.getExchangeUrl(), this.orgId, this.label);
    resourceUri = resourceUri.with({ query: `status=${this.getNodeStatus()}` });

    return {
      label: this.label,
      collapsibleState: TreeItemCollapsibleState.None,
      description: this.getTreeItemDescription(),
      command: {
        command: 'open-horizon-client.openResource',
        title: 'Open resource',
        arguments: [
          getNodeResourceURI(this.getExchangeUrl(), this.orgId, this.label),
          this.label,
        ],
      },
      resourceUri,
      contextValue: `${this._type}-node`,
      iconPath: getResourceImagePath(this._ctx, 'node.svg'),
    };
  }

  public getChildren(): Promise<ITreeNode[]> {
    return Promise.resolve([]);
  }
}