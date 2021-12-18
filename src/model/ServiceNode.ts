import { TreeItem, TreeItemCollapsibleState } from 'vscode';

import { AuthData } from '../auth';
import { ITreeNode } from './TreeNode';

export class ServiceNode implements ITreeNode {

  constructor(
    private readonly _authData: AuthData,
    private readonly _label: string,
  ) { }

  public getTreeItem(): TreeItem | Promise<TreeItem> {
    const label = this._label;
    return {
      label,
      collapsibleState: TreeItemCollapsibleState.None,
    };
  }

  public getChildren(): Promise<ITreeNode[]> {
    throw new Error('Method not implemented.');
  }

}