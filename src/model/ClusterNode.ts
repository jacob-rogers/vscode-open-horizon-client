import * as path from 'path';
import { TreeItem, TreeItemCollapsibleState } from 'vscode';

import Config from '../config';
import { OrgNode } from './OrgNode';
import { ITreeNode } from './TreeNode';
import { NodeType } from './types';

export class ClusterNode implements ITreeNode {
  private readonly _type: NodeType = NodeType.CLUSTER;

  constructor(
    private readonly _clusterId: string,
    private readonly _label: string,
  ) { }

  public getTreeItem(): TreeItem | Promise<TreeItem> {
    const label = this._label;
    return {
      label,
      collapsibleState: TreeItemCollapsibleState.Expanded,
      contextValue: `${this._type}-node`,
      iconPath: path.join(__filename, '..', '..', 'resources', 'cluster.svg'),
    };
  }

  public getChildren(): Promise<ITreeNode[]> {
    const children: ITreeNode[] = [];

    const { clusterAccounts } = Config.getInstance();
    const clusterAccount = clusterAccounts.find((ca) => ca.id === this._clusterId);
    const orgs = clusterAccount?.orgs;

    if (orgs) {
      for (const org of orgs) {
        children.push(new OrgNode(clusterAccount, org));
      }
    }


    return Promise.resolve(children);
  }
}