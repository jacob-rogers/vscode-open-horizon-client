// External dependencies
import { ExtensionContext, TreeItem, TreeItemCollapsibleState } from 'vscode';
// Internal modules
import { ClusterAccount, ClusterOrg, Node, NodeType } from '../types';
import { Constants } from '../util/constants';
import { getOrgResourceURI, getResourceImagePath } from '../util/resources';
import HorizonNode from './HorizonNode';
import ITreeNode from './TreeNode';

// model / command namespace
// eslint-disable-next-line @typescript-eslint/naming-convention
const { command: { Commands }, model } = Constants;

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
        command: Commands.Resource.Open.id,
        title: Commands.Resource.Open.title,
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

    (model.orgObjects as Node[]).forEach((root) => {
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