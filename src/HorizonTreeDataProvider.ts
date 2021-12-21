import { URL } from 'url';
import {
  Event, EventEmitter, ExtensionContext, FileSystemProvider,
  ProviderResult, TreeDataProvider, TreeItem,
} from 'vscode';

import { AuthData } from './auth';
import Config from './config';
import { ClusterNode } from './model/ClusterNode';
import { ITreeNode } from './model/TreeNode';

export class HorizonTreeDataProvider implements TreeDataProvider<ITreeNode> {
  private _onDidChangeTreeData: EventEmitter<ITreeNode | undefined> =
    new EventEmitter<ITreeNode | undefined>();
  public readonly onDidChangeTreeData: Event<ITreeNode | undefined> =
    this._onDidChangeTreeData.event;

  constructor(
    private context: ExtensionContext,
    private readonly _authData: AuthData,
    private hznFs: FileSystemProvider,
  ) { }

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
      objects.push(new ClusterNode(ca.id, ca.name));
    }

    return objects;
  }
}