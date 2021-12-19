import path = require('path');
import { TreeItem, TreeItemCollapsibleState } from 'vscode';
import { AuthData } from '../auth';
import { NodeType } from './HorizonNode';
import { OrgNode } from './OrgNode';
import { ITreeNode } from './TreeNode';

export class ClusterNode implements ITreeNode {
  private readonly _type: NodeType = 'cluster';

  constructor(
    private readonly _authData: AuthData,
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

    for (const org of [this._authData.account.orgId]) {
      children.push(
        new OrgNode(this._authData, org),
      );
    }

    return Promise.resolve(children);
  }

}