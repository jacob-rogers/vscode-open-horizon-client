import { ExtensionContext, TreeItem, TreeItemCollapsibleState } from 'vscode';

import { ClusterAccount, NodeType, ServiceGroup, ServiceMetadata } from '../types';
import { getServiceResourceURI } from '../uris';
import { getResourceImagePath } from '../utils';
import { ITreeNode } from './TreeNode';

export default class ServiceNode implements ITreeNode {
  private readonly _type: NodeType = NodeType.SERVICE;

  constructor(
    private readonly _ctx: ExtensionContext,
    private readonly _clusterAccount: ClusterAccount,
    private readonly _orgId: string,
    private readonly _label: string,
    private readonly _metadataList: ServiceMetadata[],
    private readonly _serviceGroup: ServiceGroup,
  ) { }

  private get orgId(): string {
    return this._orgId;
  }

  private get label(): string {
    return this._label;
  }

  private getExchangeUrl(): string {
    return this._clusterAccount.exchangeURL;
  }

  private getCollapsibleState(): TreeItemCollapsibleState {
    return ['arch', 'url', 'version'].includes(this.serviceGroup)
      ? TreeItemCollapsibleState.Collapsed
      : TreeItemCollapsibleState.None;
  }

  private getDescription(): string | undefined {
    return this.serviceGroup === 'none'
      ? `${this._metadataList[0].arch}-${this._metadataList[0].version}`
      : undefined;
  }

  private get serviceGroup(): string {
    return this._serviceGroup;
  }

  private getIconPath(): string | undefined {
    return ['arch', 'version'].includes(this.serviceGroup)
      ? getResourceImagePath(this._ctx, `${this._serviceGroup}.svg`)
      : this._serviceGroup === 'none'
        ? getResourceImagePath(this._ctx, `service.svg`)
        : undefined;
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
        command: 'open-horizon-client.openResource',
        title: 'Open resource',
        arguments: [
          getServiceResourceURI(this.getExchangeUrl(), this.orgId, this.label),
          this.label,
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
    switch (this._serviceGroup) {
      case 'url':
        ctxValueSuffix = 'url';
        break;
      case 'arch':
        ctxValueSuffix = 'byArch';
        break;
      case 'version':
        ctxValueSuffix = 'byVersion';
        break;
    }

    return ctxValueSuffix
      ? `${this._type}.${ctxValueSuffix}`
      : this._type.toString();
  }

  public getChildren(): Promise<ITreeNode[]> {
    const children: ITreeNode[] = [];

    if (this._serviceGroup === 'url') {
      const childrenByArch = new Map<string, ServiceMetadata[]>();
      for (const meta of this._metadataList) {
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
            this._ctx, this._clusterAccount, this._orgId,
            serviceArch, serviceMetadataList, 'arch',
          ),
        );
      }

      return Promise.resolve(children);
    } else if (this._serviceGroup === 'arch') {
      const childrenByVersion = new Map<string, ServiceMetadata[]>();
      for (const meta of this._metadataList) {
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
            this._ctx, this._clusterAccount, this._orgId,
            serviceVersion, serviceMetadataList, 'version',
          ),
        );
      }

      return Promise.resolve(children);
    }

    const childrenExact = new Map<string, ServiceMetadata[]>();
    for (const meta of this._metadataList) {
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
          this._ctx, this._clusterAccount, this._orgId,
          service, serviceMetadataList, 'none',
        ),
      );
    }

    return Promise.resolve(children);
  }
}