import * as path from 'path';
import { TreeItem, TreeItemCollapsibleState } from 'vscode';

import { AuthData } from '../auth';
import { OrgNode } from './OrgNode';
import { ITreeNode } from './TreeNode';
import { NodeType } from './types';

export class ClusterNode implements ITreeNode {
  private readonly _type: NodeType = NodeType.CLUSTER;

  constructor(
    private readonly _authData: AuthData,
    private readonly _label: string,
    private readonly _children?: ClusterNode[],
  ) { }

  public getTreeItem(): TreeItem | Promise<TreeItem> {
    const label = this._label;
    return {
      label,
      collapsibleState: TreeItemCollapsibleState.Expanded,
      contextValue: `${this._type}-node`,
      iconPath: !this._children
        ? path.join(__filename, '..', '..', 'resources', 'cluster.svg')
        : undefined,
    };
  }

  public getChildren(): Promise<ITreeNode[]> {
    const children: ITreeNode[] = [];

    if (this._children) {
      for (const child of this._children) {
        children.push(child);
      }
    } else {
      for (const org of [this._authData.account.orgId]) {
        children.push(new OrgNode(this._authData, org));
      }
    }

    return Promise.resolve(children);
  }
}