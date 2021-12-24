// External dependencies
import { AxiosError } from 'axios';
import * as path from 'path';
import { URL } from 'url';
import { ExtensionContext, Uri, window, workspace } from 'vscode';
// Internal modules
import { ext } from '../extensionVariables';
import * as http from '../http';
import { HTTPServiceAccount, NodeType } from '../types';
import { getExtensionPath } from './common';
import { Constants } from './constants';

export function getResourceImagePath(ctx: ExtensionContext, imageFileName: string): string {
  return path.join(getExtensionPath(ctx), 'resources', imageFileName);
}

export async function loadResource(sa: HTTPServiceAccount, kind: NodeType, uri: Uri) {
  const resourceId = uri.path.split('/').pop();
  let httpUri = '';
  switch (kind) {
    case NodeType.SERVICE:
      httpUri = http.getApiServicesUrl(sa, resourceId);
  }

  const client = http.Client(sa);

  const fileName = uri.with({ path: uri.path + `.${Constants.resourceDefFileType}` });

  let data;
  try {
    const response = await client.get(httpUri);
    data = Object.values(response.data.services)[0];

    await workspace.fs.writeFile(fileName, Buffer.from(JSON.stringify(data, null, 2)));
  } catch (response: unknown) {
    if ((response as AxiosError).message) {
      window.showErrorMessage(
        `Cannot fetch Horizon object '${resourceId}' of type '${kind}': ${(response as AxiosError).message}`
      );
      return Promise.reject();
    }

    window.showErrorMessage(`Error: ${response}`);
    return Promise.reject();
  };

  workspace.openTextDocument(fileName)
    .then((doc) => {
      if (doc) {
        window.showTextDocument(doc);
      }
    },
      (err) => window.showErrorMessage(`Error loading document: ${err}`));
}

export function getHost(httpUri: string): string {
  return new URL(httpUri).host;
}

export function getClusterResourceURI(httpUri: string): Uri {
  const host = getHost(httpUri);
  return Uri.from({ scheme: ext.vfsScheme, authority: host });
}

export function getOrgResourceURI(httpUri: string, orgId: string): Uri {
  const baseUri = getClusterResourceURI(httpUri);
  return baseUri.with({ path: `/orgs/${orgId}` });
}

export function getNodeResourceURI(httpUri: string, orgId: string, nodeId: string): Uri {
  const baseUri = getOrgResourceURI(httpUri, orgId);
  return baseUri.with({ path: baseUri.path + `/nodes/${nodeId}` });
}

export function getPatternResourceURI(httpUri: string, orgId: string, patternId: string): Uri {
  const baseUri = getOrgResourceURI(httpUri, orgId);
  return baseUri.with({ path: baseUri.path + `/patterns/${patternId}` });
}

export function getPolicyResourceURI(httpUri: string, orgId: string, policyId: string): Uri {
  const baseUri = getOrgResourceURI(httpUri, orgId);
  return baseUri.with({ path: baseUri.path + `/policies/${policyId}` });
}

export function getServiceResourceURI(httpUri: string, orgId: string, serviceId: string): Uri {
  const baseUri = getOrgResourceURI(httpUri, orgId);
  return baseUri.with({ path: baseUri.path + `/services/${serviceId}` });
}
