import {
  Event, EventEmitter, ExtensionContext, ProviderResult, TreeDataProvider, TreeItem
} from 'vscode';

import Config from '../config';
import { ClusterNode } from '../model/ClusterNode';
import { ITreeNode } from '../model/TreeNode';

export class HorizonTreeDataProvider implements TreeDataProvider<ITreeNode> {
  private _onDidChangeTreeData: EventEmitter<ITreeNode | undefined> =
    new EventEmitter<ITreeNode | undefined>();
  public readonly onDidChangeTreeData: Event<ITreeNode | undefined> =
    this._onDidChangeTreeData.event;

  constructor(private readonly _ctx: ExtensionContext) { }

  refresh(node?: ITreeNode): void {
    this._onDidChangeTreeData.fire(node);
  }

  getTreeItem(element: ITreeNode): TreeItem | Thenable<TreeItem> {
    return element.getTreeItem();
  }

  getChildren(element?: ITreeNode): ProviderResult<ITreeNode[]> {
    // If no cluster accounts provided, this will show Welcome view content instead
    if (!Config.getInstance().clusterAccounts.length) {
      return [];
    }

    if (!element) {
      return this.getHorizonObjects();
    }

    return element.getChildren();
  }

  private getHorizonObjects(): ITreeNode[] {
    const { clusterAccounts } = Config.getInstance();

    const objects: ITreeNode[] = [];
    for (const ca of clusterAccounts) {
      objects.push(new ClusterNode(this._ctx, ca.id, ca.name));
    }

    return objects;
  }
}