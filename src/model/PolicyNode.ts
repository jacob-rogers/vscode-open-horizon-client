import * as path from 'path';
import { TreeItem, TreeItemCollapsibleState } from 'vscode';

import { getPolicyResourceURI } from '../uris';
import { ITreeNode } from './TreeNode';
import { ClusterAccount, NodeType } from '../types';

export default class PolicyItem implements ITreeNode {
  private readonly _type: NodeType = NodeType.POLICY;

  constructor(
    private readonly _clusterAccount: ClusterAccount,
    private readonly _orgId: string,
    private readonly _label: string,
  ) { }

  public getTreeItem(): TreeItem | Promise<TreeItem> {
    const label = this._label;
    const orgId = this._orgId;
    return {
      label,
      collapsibleState: TreeItemCollapsibleState.None,
      command: {
        command: 'open-horizon-client.openResource',
        title: 'Open resource',
        arguments: [ getPolicyResourceURI(this._clusterAccount.exchangeURL, orgId, label), label ],
      },
      contextValue: `${this._type}-node`,
      iconPath: path.join(__filename, '..', '..', 'resources', 'policy.svg'),
    };
  }

  public getChildren(): Promise<ITreeNode[]> {
    return Promise.resolve([]);
  }

}