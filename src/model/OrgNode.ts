import { ExtensionContext, TreeItem, TreeItemCollapsibleState } from 'vscode';

import { ClusterAccount, ClusterOrg, Node, NodeType } from '../types';
import { getOrgResourceURI } from '../uris';
import { getResourceImagePath } from '../utils';
import { HORIZON_ORG_OBJECTS } from './constants';
import { HorizonNode } from './HorizonNode';
import { ITreeNode } from './TreeNode';

export default class OrgNode implements ITreeNode {
  private readonly _type: NodeType = NodeType.ORG;

  constructor(
    private readonly _ctx: ExtensionContext,
    private readonly _clusterAccount: ClusterAccount,
    private readonly _org: ClusterOrg,
  ) { }

  private get org(): ClusterOrg {
    return this._org;
  }

  private getExchangeUrl(): string {
    return this._clusterAccount.exchangeURL;
  }

  public getTreeItem(): TreeItem | Promise<TreeItem> {
    const label = this.org.id;
    return {
      label,
      collapsibleState: TreeItemCollapsibleState.Collapsed,
      description: `(${this._type})`,
      command: {
        command: 'open-horizon-client.openResource',
        title: 'Open resource',
        arguments: [
          getOrgResourceURI(this.getExchangeUrl(), label),
          label,
        ],
      },
      contextValue: `${this._type}-node`,
      iconPath: getResourceImagePath(this._ctx, 'org.svg'),
    };
  }

  public getChildren(): Promise<ITreeNode[]> {
    const children: ITreeNode[] = [];

    (HORIZON_ORG_OBJECTS as Node[]).forEach((root) => {
      children.push(
        new HorizonNode(
          this._ctx, this._clusterAccount,
          this.org.id, root.label, root.type,
        ),
      );
    });

    return Promise.resolve(children);
  }
}