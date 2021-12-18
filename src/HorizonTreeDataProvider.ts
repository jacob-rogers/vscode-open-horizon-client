import {
  Event, EventEmitter, ExtensionContext,
  ProviderResult, TreeDataProvider, TreeItem
} from 'vscode';
import { AuthData } from './auth';
import { HorizonNode, NodeType } from './model/HorizonNode';
import { ITreeNode } from './model/TreeNode';

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
    const horizonObjects: ITreeNode[] = [];
    ROOTS.forEach((root) => {
      const node = new HorizonNode(
        this._authData,
        (root as Node).label,
        (root as Node).type,
        true,
      );

      horizonObjects.push(node);
    });

    return horizonObjects;
  }
}