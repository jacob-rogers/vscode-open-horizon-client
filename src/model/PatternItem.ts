import * as path from 'path';
import { TreeItem, TreeItemCollapsibleState } from 'vscode';

import { AuthData } from '../auth';
import { ITreeNode } from './TreeNode';
import { NodeType } from './types';

export class PatternItem implements ITreeNode {
  private readonly _type: NodeType = NodeType.PATTERN;

  constructor(
    private readonly _authData: AuthData,
    private readonly _label: string,
  ) { }

  public getTreeItem(): TreeItem | Promise<TreeItem> {
    const label = this._label;
    return {
      label,
      collapsibleState: TreeItemCollapsibleState.None,
      iconPath: path.join(__filename, '..', '..', 'resources', 'pattern.svg'),
    };
  }

  public getChildren(): Promise<ITreeNode[]> {
    return Promise.resolve([]);
  }

}