import * as path from 'path';
import { URL } from 'url';
import { ExtensionContext, Uri, window, workspace } from 'vscode';
import { ext } from '../extensionVariables';
import { getExtensionPath } from './common';

export function getResourceImagePath(ctx: ExtensionContext, imageFileName: string): string {
  return path.join(getExtensionPath(ctx), 'resources', imageFileName);
}

export function loadResource(uri: Uri) {
  const fileType = 'json';
  const formattedUri = substituteSlashes(uri.with({ path: uri.path + `.${fileType}` }));
  workspace.openTextDocument(formattedUri)
    .then((doc) => {
      if (doc) {
        window.showTextDocument(doc);
      }
    },
      (err) => window.showErrorMessage(`Error loading document: ${err}`));
}

function substituteSlashes(uri: Uri): Uri {
  const resultUri = `${uri.scheme}:/` + uri.toString()
    .replace(uri.scheme + ':', '')
    .replace('/', '-');

  return Uri.parse(resultUri);
}


export function getHost(httpUri: string): string {
  return new URL(httpUri).host;
}

export function getClusterResourceURI(httpUri: string): Uri {
  const host = getHost(httpUri);
  return Uri.parse(`${ext.vfsScheme}:/cluster-${host}`, true);
}

export function getOrgResourceURI(httpUri: string, orgId: string): Uri {
  const baseUri = getClusterResourceURI(httpUri);
  return baseUri.with({ path: baseUri.path + `/orgs/${orgId}` });
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
