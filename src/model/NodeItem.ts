import path = require('path');
import { TreeItem, TreeItemCollapsibleState, Uri } from 'vscode';

import { AuthData } from '../auth';
import { ITreeNode } from './TreeNode';

export interface NodeMetadata {
  arch: string;
  name: string;
  publicKey: string;
}

export class NodeItem implements ITreeNode {

  constructor(
    private readonly _authData: AuthData,
    private readonly _label: string,
    private readonly _metadata: NodeMetadata,
  ) { }

  public getTreeItem(): TreeItem | Promise<TreeItem> {
    const { arch } = this._metadata;
    const label = this._label;
    const nodeStatus = this._metadata.publicKey.length ? 'running' : 'stopped';
    const resourceUri =
      Uri.parse(`hzn://domain/org/node/${label}?status=${nodeStatus}`);
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