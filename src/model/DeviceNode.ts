import * as path from 'path';
import { URL } from 'url';
import { TreeItem, TreeItemCollapsibleState } from 'vscode';

import { getNodeResourceURI } from '../uris';
import { ITreeNode } from './TreeNode';
import { ClusterAccount, NodeMetadata, NodeType } from '../types';

export default class DeviceNode implements ITreeNode {
  private readonly _type: NodeType = NodeType.NODE;

  constructor(
    private readonly _clusterAccount: ClusterAccount,
    private readonly _orgId: string,
    private readonly _label: string,
    private readonly _metadata: NodeMetadata,
  ) { }

  public getTreeItem(): TreeItem | Promise<TreeItem> {
    const { arch } = this._metadata;
    const orgId = this._orgId;
    const clusterHost = new URL(this._clusterAccount.exchangeURL).host;
    const label = this._label.startsWith(orgId)
      ? this._label.split('/', 2)[1]
      : this._label;
    const nodeStatus = this._metadata.publicKey.length ? 'running' : 'stopped';
    let resourceUri = getNodeResourceURI(this._clusterAccount.exchangeURL, orgId, label);
    resourceUri = resourceUri.with({ query: `status=${nodeStatus}` });

    return {
      label,
      description: nodeStatus === 'running'
        ? `${arch} -- running`
        : `${arch} -- not running`,
      command: {
        command: 'open-horizon-client.openResource',
        title: 'Open resource',
        arguments: [ getNodeResourceURI(this._clusterAccount.exchangeURL, orgId, label), label ],
      },
      resourceUri,
      collapsibleState: TreeItemCollapsibleState.None,
      iconPath: path.join(__filename, '..', '..', 'resources', 'node.svg'),
    };
  }

  public getChildren(): Promise<ITreeNode[]> {
    return Promise.resolve([]);
  }
}