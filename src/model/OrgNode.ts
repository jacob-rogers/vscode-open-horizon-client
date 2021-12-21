import * as path from 'path';
import { TreeItem, TreeItemCollapsibleState } from 'vscode';

import { getOrgResourceURI } from '../uris';
import { HorizonNode } from './HorizonNode';
import { ITreeNode } from './TreeNode';
import { ClusterAccount, ClusterOrg, Node, NodeType } from './types';

const HORIZON_ORG_OBJECTS = [
  { label: 'Services', type: NodeType.SERVICE },
  { label: 'Nodes', type: NodeType.NODE },
  { label: 'Patterns', type: NodeType.PATTERN },
  { label: 'Policies', type: NodeType.POLICY }
];

export class OrgNode implements ITreeNode {
  private readonly _type: NodeType = NodeType.ORG;

  constructor(
    private readonly _clusterAccount: ClusterAccount,
    private readonly _org: ClusterOrg,
  ) { }

  public getTreeItem(): TreeItem | Promise<TreeItem> {
    const label = this._org.id;
    return {
      label,
      description: '(org)',
      command: {
        command: 'open-horizon-client.openResource',
        title: 'Open resource',
        arguments: [ getOrgResourceURI(this._clusterAccount.exchangeURL, label), label ],
      },
      collapsibleState: TreeItemCollapsibleState.Collapsed,
      contextValue: `${this._type}-node`,
      iconPath: path.join(__filename, '..', '..', 'resources', 'org.svg'),
    };
  }

  public getChildren(): Promise<ITreeNode[]> {
    const children: ITreeNode[] = [];

    (HORIZON_ORG_OBJECTS as Node[]).forEach((root) => {
      children.push(
        new HorizonNode(this._clusterAccount, this._org.id, root.label, root.type),
      );
    });

    return Promise.resolve(children);
  }

}