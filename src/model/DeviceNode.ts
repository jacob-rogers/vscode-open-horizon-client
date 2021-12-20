import * as path from 'path';
import { URL } from 'url';
import { TreeItem, TreeItemCollapsibleState } from 'vscode';

import { AuthData } from '../auth';
import { getNodeResourceURI } from '../uris';
import { ITreeNode } from './TreeNode';
import { NodeMetadata, NodeType } from './types';

export class DeviceNode implements ITreeNode {
  private readonly _type: NodeType = NodeType.NODE;

  constructor(
    private readonly _authData: AuthData,
    private readonly _label: string,
    private readonly _metadata: NodeMetadata,
  ) { }

  public getTreeItem(): TreeItem | Promise<TreeItem> {
    const { arch } = this._metadata;
    const { orgId } = this._authData.account;
    const clusterHost = new URL(this._authData.account.exchangeURL).host;
    const label = this._label.startsWith(orgId)
      ? this._label.split('/', 2)[1]
      : this._label;
    const nodeStatus = this._metadata.publicKey.length ? 'running' : 'stopped';
    const resourceUri = getNodeResourceURI(clusterHost, orgId, label)
      .with({ query: `status=${nodeStatus}` });

    return {
      label,
      description: nodeStatus === 'running'
        ? `${arch} -- running`
        : `${arch} -- not running`,
      resourceUri,
      collapsibleState: TreeItemCollapsibleState.None,
      iconPath: path.join(__filename, '..', '..', 'resources', 'node.svg'),
    };
  }

  public getChildren(): Promise<ITreeNode[]> {
    return Promise.resolve([]);
  }
}