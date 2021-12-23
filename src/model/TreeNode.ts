import { TreeItem } from 'vscode';

export default interface ITreeNode {
  getTreeItem(): Promise<TreeItem> | TreeItem;
  getChildren(): Promise<ITreeNode[]>;
}
