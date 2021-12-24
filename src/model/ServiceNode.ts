// External dependencies
import { ExtensionContext, TreeItem, TreeItemCollapsibleState } from 'vscode';
// Internal modules
import { ClusterAccount, ExplorerServiceGroup, HTTPServiceAccount, NodeType, ServiceMetadata } from '../types';
import { Constants } from '../util/constants';
import { getResourceImagePath, getServiceResourceURI } from '../util/resources';
import ITreeNode from './TreeNode';

// Command namespace
// eslint-disable-next-line @typescript-eslint/naming-convention
const { command: { Commands } } = Constants;

export default class ServiceNode implements ITreeNode {
  private readonly _type: NodeType = NodeType.SERVICE;

  constructor(
    private readonly _ctx: ExtensionContext,
    private readonly _clusterAccount: ClusterAccount,
    private readonly _orgId: string,
    private readonly _serviceAccount: HTTPServiceAccount,
    private readonly _label: string,
    private readonly _metadataList: ServiceMetadata[],
    private readonly _serviceGroup: ExplorerServiceGroup,
  ) { }

  private get metadataList(): ServiceMetadata[] {
    return this._metadataList;
  }

  private get orgId(): string {
    return this._orgId;
  }

  private get label(): string {
    return this._label;
  }

  private get serviceGroup(): ExplorerServiceGroup {
    return this._serviceGroup;
  }

  private getCollapsibleState(): TreeItemCollapsibleState {
    if ([
      ExplorerServiceGroup.ARCH,
      ExplorerServiceGroup.URL,
      ExplorerServiceGroup.VERSION,
    ].includes(this.serviceGroup)) {
      return TreeItemCollapsibleState.Collapsed;
    }

    return TreeItemCollapsibleState.None;
  }

  private getDescription(): string | undefined {
    return this.serviceGroup === ExplorerServiceGroup.NONE
      ? `${this.metadataList[0].arch}-${this.metadataList[0].version}`
      : undefined;
  }

  private getExchangeUrl(): string {
    return this._clusterAccount.exchangeURL;
  }

  private getIconPath(): string | undefined {
    if ([ExplorerServiceGroup.ARCH, ExplorerServiceGroup.VERSION].includes(this.serviceGroup)) {
      return getResourceImagePath(this._ctx, `${this.serviceGroup}.svg`);
    } else if (this.serviceGroup === ExplorerServiceGroup.NONE) {
      return getResourceImagePath(this._ctx, `service.svg`);
    }

    return undefined;
  }

  public getTreeItem(): TreeItem | Promise<TreeItem> {
    const collapsibleState = this.getCollapsibleState();
    const contextValue = this.getContextValue();
    const description = this.getDescription();
    const iconPath = this.getIconPath();

    return {
      label: this.label,
      collapsibleState,
      command: {
        command: Commands.Resource.Open.id,
        title: Commands.Resource.Open.title,
        arguments: [
          this._serviceAccount,
          this._type,
          getServiceResourceURI(
            this.getExchangeUrl(),
            this.orgId,
            `${this.label}_${this._metadataList[0].version}_${this._metadataList[0].arch}`,
          ),
        ],
      },
      description,
      contextValue,
      iconPath,
      tooltip: this.label.toString(),
    };
  }

  private getContextValue(): string {
    let ctxValueSuffix;
    switch (this.serviceGroup) {
      case ExplorerServiceGroup.URL:
        ctxValueSuffix = 'url';
        break;
      case ExplorerServiceGroup.ARCH:
        ctxValueSuffix = 'byArch';
        break;
      case ExplorerServiceGroup.VERSION:
        ctxValueSuffix = 'byVersion';
        break;
    }

    return ctxValueSuffix
      ? `${this._type}.${ctxValueSuffix}`
      : this._type.toString();
  }

  public getChildren(): Promise<ITreeNode[]> {
    const children: ITreeNode[] = [];

    if (this.serviceGroup === ExplorerServiceGroup.URL) {
      const childrenByArch = new Map<string, ServiceMetadata[]>();

      for (const meta of this.metadataList) {
        if (childrenByArch.has(meta.arch)) {
          const oldServiceItemList = childrenByArch.get(meta.arch) as ServiceMetadata[];
          const newServiceItemList = [...oldServiceItemList, meta];
          childrenByArch.set(meta.arch, newServiceItemList);
        } else {
          childrenByArch.set(meta.arch, [meta]);
        }
      }

      for (const [serviceArch, serviceMetadataList] of childrenByArch.entries()) {
        children.push(
          new ServiceNode(
            this._ctx, this._clusterAccount, this._orgId, this._serviceAccount,
            serviceArch, serviceMetadataList, ExplorerServiceGroup.ARCH,
          ),
        );
      }

      return Promise.resolve(children);
    } else if (this._serviceGroup === ExplorerServiceGroup.ARCH) {
      const childrenByVersion = new Map<string, ServiceMetadata[]>();

      for (const meta of this.metadataList) {
        if (childrenByVersion.has(meta.version)) {
          const oldServiceItemList = childrenByVersion.get(meta.version) as ServiceMetadata[];
          const newServiceItemList = [...oldServiceItemList, meta];
          childrenByVersion.set(meta.version, newServiceItemList);
        } else {
          childrenByVersion.set(meta.version, [meta]);
        }
      }

      for (const [serviceVersion, serviceMetadataList] of childrenByVersion.entries()) {
        children.push(
          new ServiceNode(
            this._ctx, this._clusterAccount, this._orgId, this._serviceAccount,
            serviceVersion, serviceMetadataList, ExplorerServiceGroup.VERSION,
          ),
        );
      }

      return Promise.resolve(children);
    }

    const childrenExact = new Map<string, ServiceMetadata[]>();

    for (const meta of this.metadataList) {
      if (childrenExact.has(meta.url)) {
        const oldServiceItemList = childrenExact.get(meta.url) as ServiceMetadata[];
        const newServiceItemList = [...oldServiceItemList, meta];
        childrenExact.set(meta.url, newServiceItemList);
      } else {
        childrenExact.set(meta.url, [meta]);
      }
    }

    for (const [service, serviceMetadataList] of childrenExact.entries()) {
      children.push(
        new ServiceNode(
          this._ctx, this._clusterAccount, this._orgId, this._serviceAccount,
          service, serviceMetadataList, ExplorerServiceGroup.NONE,
        ),
      );
    }

    return Promise.resolve(children);
  }
}