import { ExtensionContext, TreeItem, TreeItemCollapsibleState } from 'vscode';
import Config from '../config';
import { NodeType } from '../types';
import { getResourceImagePath } from '../util/resources';
import OrgNode from './OrgNode';
import ITreeNode from './TreeNode';

export class ClusterNode implements ITreeNode {
  private readonly _type: NodeType = NodeType.CLUSTER;

  constructor(
    private readonly _ctx: ExtensionContext,
    private readonly _clusterId: string,
    private readonly _label: string,
  ) { }

  private get clusterId(): string {
    return this._clusterId;
  }

  private get label(): string {
    return this._label;
  }

  public getTreeItem(): TreeItem | Promise<TreeItem> {
    return {
      label: this.label,
      collapsibleState: TreeItemCollapsibleState.Expanded,
      contextValue: `${this._type}-node`,
      iconPath: getResourceImagePath(this._ctx, 'cluster.svg'),
    };
  }

  public getChildren(): Promise<ITreeNode[]> {
    const children: ITreeNode[] = [];

    const { clusterAccounts } = Config.getInstance();
    const clusterAccount = clusterAccounts.find((ca) => ca.id === this.clusterId);
    const orgs = clusterAccount?.orgs;

    if (orgs) {
      for (const org of orgs) {
        children.push(new OrgNode(this._ctx, clusterAccount, org));
      }
    }


    return Promise.resolve(children);
  }
}