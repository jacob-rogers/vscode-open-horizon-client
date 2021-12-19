import path = require('path');
import { TreeItem, TreeItemCollapsibleState } from 'vscode';
import { AuthData } from '../auth';
import { HorizonNode, NodeType } from './HorizonNode';
import { ITreeNode } from './TreeNode';

interface Node {
  type: NodeType;
  label: string;
  data?: any;
}

const ROOTS = [
  { label: 'Services', type: 'service' },
  { label: 'Nodes', type: 'node' },
  { label: 'Patterns', type: 'pattern' },
  { label: 'Policies', type: 'policy' }
];

export class OrgNode implements ITreeNode {
  private readonly _type: NodeType = 'org';

  constructor(
    private readonly _authData: AuthData,
    private readonly _label: string,
  ) { }

  public getTreeItem(): TreeItem | Promise<TreeItem> {
    const label = this._label;
    return {
      label,
      collapsibleState: TreeItemCollapsibleState.Collapsed,
      contextValue: `${this._type}-node`,
      iconPath: path.join(__filename, '..', '..', 'resources', 'org.svg'),
    };
  }

  public getChildren(): Promise<ITreeNode[]> {
    const children: ITreeNode[] = [];

    (ROOTS as Node[]).forEach((root) => {
      children.push(
        new HorizonNode(this._authData, root.label, root.type, true),
      );
    });

    return Promise.resolve(children);
  }

}