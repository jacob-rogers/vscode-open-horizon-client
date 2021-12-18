import path = require('path');
import { TreeItem, TreeItemCollapsibleState } from 'vscode';

import { AuthData } from '../auth';
import { ITreeNode } from './TreeNode';

export class NodeItem implements ITreeNode {

  constructor(
    private readonly _authData: AuthData,
    private readonly _label: string,
    private readonly _items?: string[],
  ) { }

  public getTreeItem(): TreeItem | Promise<TreeItem> {
    const label = this._label;
    return {
      label,
      collapsibleState: this._items?.length
        ? TreeItemCollapsibleState.Collapsed
        : TreeItemCollapsibleState.None,
      iconPath: this._items?.length
        ? path.join(__filename, '..', '..', 'resources', 'org.svg')
        : path.join(__filename, '..', '..', 'resources', 'node.svg'),
    };
  }

  public getChildren(): Promise<ITreeNode[]> {
    const children: ITreeNode[] = [];
    if (this._items) {
      for (let item of this._items) {
        children.push(new NodeItem(this._authData, item));
      }
    }

    return Promise.resolve(children);
  }

}