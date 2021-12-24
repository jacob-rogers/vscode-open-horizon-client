// External dependencies
import { ExtensionContext, TreeItem, TreeItemCollapsibleState } from 'vscode';
// Internal modules
import { ClusterAccount, NodeType } from '../types';
import { Constants } from '../util/constants';
import { getPolicyResourceURI, getResourceImagePath } from '../util/resources';
import ITreeNode from './TreeNode';

// Command namespace
// eslint-disable-next-line @typescript-eslint/naming-convention
const { command: { Commands } } = Constants;

export default class PolicyItem implements ITreeNode {
  private readonly _type: NodeType = NodeType.POLICY;

  constructor(
    private readonly _ctx: ExtensionContext,
    private readonly _clusterAccount: ClusterAccount,
    private readonly _orgId: string,
    private readonly _label: string,
  ) { }

  private get label(): string {
    return this._label;
  }

  private get orgId(): string {
    return this._orgId;
  }

  private getExchangeUrl(): string {
    return this._clusterAccount.exchangeURL;
  }

  public getTreeItem(): TreeItem | Promise<TreeItem> {
    return {
      label: this.label,
      collapsibleState: TreeItemCollapsibleState.None,
      command: {
        command: Commands.Resource.Open.id,
        title: Commands.Resource.Open.title,
        arguments: [
          getPolicyResourceURI(this.getExchangeUrl(), this.orgId, this.label),
          this.label,
        ],
      },
      contextValue: `${this._type}-node`,
      iconPath: getResourceImagePath(this._ctx, 'policy.svg'),
    };
  }

  public getChildren(): Promise<ITreeNode[]> {
    return Promise.resolve([]);
  }

}