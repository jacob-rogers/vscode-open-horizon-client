import { ExtensionContext, TreeItem, TreeItemCollapsibleState } from 'vscode';

import { ClusterAccount, NodeType } from '../types';
import { getPatternResourceURI } from '../uris';
import { getResourceImagePath } from '../utils';
import { ITreeNode } from './TreeNode';

export default class PatternNode implements ITreeNode {
  private readonly _type: NodeType = NodeType.PATTERN;

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

  private getExchangeURL(): string {
    return this._clusterAccount.exchangeURL;
  }

  public getTreeItem(): TreeItem | Promise<TreeItem> {
    return {
      label: this.label,
      collapsibleState: TreeItemCollapsibleState.None,
      command: {
        command: 'open-horizon-client.openResource',
        title: 'Open resource',
        arguments: [
          getPatternResourceURI(this.getExchangeURL(), this.orgId, this.label),
          this.label,
        ],
      },
      contextValue: `${this._type}-node`,
      iconPath: getResourceImagePath(this._ctx, 'pattern.svg'),
    };
  }

  public getChildren(): Promise<ITreeNode[]> {
    return Promise.resolve([]);
  }

}