import {
  Event, EventEmitter, ExtensionContext,
  ProviderResult, TreeDataProvider, TreeItem
} from 'vscode';
import { AuthData } from './auth';
import { ClusterNode } from './model/ClusterNode';
import { ITreeNode } from './model/TreeNode';

export class HorizonTreeDataProvider implements TreeDataProvider<ITreeNode> {

  private _onDidChangeTreeData: EventEmitter<ITreeNode> = new EventEmitter<ITreeNode>();
  public readonly onDidChangeTreeData: Event<ITreeNode> = this._onDidChangeTreeData.event;

  constructor(
    private context: ExtensionContext,
    private readonly _authData: AuthData) {
  }

  getTreeItem(element: ITreeNode): TreeItem | Thenable<TreeItem> {
    return element.getTreeItem();
  }

  getChildren(element?: ITreeNode): ProviderResult<ITreeNode[]> {
    if (!element) {
      return this.getHorizonObjects();
    }

    return element.getChildren();
  }

  private getHorizonObjects(): ITreeNode[] {
    return [
      new ClusterNode(this._authData, 'Edge Cluster')
    ];
  }
}