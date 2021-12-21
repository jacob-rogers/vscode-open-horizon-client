import * as path from 'path';
import { TreeItem, TreeItemCollapsibleState } from 'vscode';

import { getServiceResourceURI } from '../uris';
import { ITreeNode } from './TreeNode';
import { ClusterAccount, NodeType, ServiceGroup, ServiceMetadata } from './types';

export class ServiceItem implements ITreeNode {
  private readonly _type: NodeType = NodeType.SERVICE;

  constructor(
    private readonly _clusterAccount: ClusterAccount,
    private readonly _orgId: string,
    private readonly _label: string,
    private readonly _metadataList: ServiceMetadata[],
    private readonly _serviceGroup: ServiceGroup,
  ) { }

  public getTreeItem(): TreeItem | Promise<TreeItem> {
    const collapsibleState =
      ['arch', 'url', 'version'].includes(this._serviceGroup)
        ? TreeItemCollapsibleState.Collapsed
        : TreeItemCollapsibleState.None;
    const label = this._label;
    const orgId = this._orgId;
    const contextValue = this._serviceGroup === 'url'
      ? 'service.url'
      : this._serviceGroup === 'arch'
        ? 'service.byArch'
        : this._serviceGroup === 'version'
          ? 'service.byVersion'
          : 'service';
    const description = this._serviceGroup === 'none'
      ? `${this._metadataList[0].arch}-${this._metadataList[0].version}`
      : undefined;
    const iconPath = ['arch', 'version'].includes(this._serviceGroup)
      ? path.join(__filename, '..', '..', 'resources', `${this._serviceGroup}.svg`)
      : this._serviceGroup === 'none'
        ? path.join(__filename, '..', '..', 'resources', 'service.svg')
        : undefined;

    return {
      label,
      collapsibleState,
      command: {
        command: 'open-horizon-client.openResource',
        title: 'Open resource',
        arguments: [ getServiceResourceURI(this._clusterAccount.exchangeURL, orgId, label), label ],
      },
      description,
      contextValue,
      iconPath,
      tooltip: label.toString(),
    };
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
          new ServiceItem(
            this._clusterAccount, this._orgId,
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
          new ServiceItem(
            this._clusterAccount, this._orgId,
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
        new ServiceItem(
          this._clusterAccount, this._orgId,
          service, serviceMetadataList, 'none',
        ),
      );
    }

    return Promise.resolve(children);
  }
}