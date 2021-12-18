import { TreeItem } from 'vscode';

export interface ITreeNode {
  getTreeItem(): Promise<TreeItem> | TreeItem;
  getChildren(): Promise<ITreeNode[]>;
}
