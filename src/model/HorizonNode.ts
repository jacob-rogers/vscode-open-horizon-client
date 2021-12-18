import axios, { AxiosError } from 'axios';
import * as https from 'https';
import { URL } from 'url';
import { TreeItem, TreeItemCollapsibleState } from 'vscode';

import { AuthData } from '../auth';
import { ServiceNode } from './ServiceNode';
import { ITreeNode } from './TreeNode';

export type NodeType = 'service' | 'node' | 'pattern' | 'policy';

export class HorizonNode implements ITreeNode {

  private readonly _label: string;
  private readonly _type: NodeType;
  private readonly _isRoot: boolean;

  constructor(
    private readonly _authData: AuthData,
    label: string,
    type: NodeType,
    isRoot = false,
  ) {
    this._label = label;
    this._type = type;
    this._isRoot = isRoot;
  }

  public getTreeItem(): Promise<TreeItem> | TreeItem {
    const label = `${this._label} (${this._type})`;
    return {
      label,
      collapsibleState: TreeItemCollapsibleState.Collapsed,
    };
  }

  public async getChildren(): Promise<ITreeNode[]> {
    const children: ITreeNode[] = [];

    if (this._type === 'service' && this._isRoot === true) {
      const { orgId, exchangeUserAuth, exchangeURL } = this._authData.account;
      const [username, password] = exchangeUserAuth.split(':', 2);
      const url = new URL(encodeURI(`${exchangeURL}orgs/${orgId}/services`)).toString();

      const agent = new https.Agent({ rejectUnauthorized: false });
      // to make HTTP request work in VS Code extension,
      // this workaround with global agent is needed, see
      // https://stackoverflow.com/questions/69596523/ignoring-axios-error-for-invalid-certificates-when-creating-a-vscode-extension
      https.globalAgent.options.rejectUnauthorized = false;

      await axios(url, {
        method: 'GET',
        httpsAgent: agent,
        auth: {
          username: `${orgId}/${username}`,
          password,
        },
      })
        .then((response) => {
          Object.keys(response.data.services).forEach((service: string) => {
            children.push(
              new ServiceNode(this._authData, service),
            );
          });
        })
        .catch((response: AxiosError) => {
          console.log('axios.error.response', response.toJSON());
        });
    }

    return Promise.resolve(children);
  }
}