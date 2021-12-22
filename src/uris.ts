import { URL } from 'url';
import { Uri } from 'vscode';

const scheme = 'hzn';

export function getHost(httpUri: string): string {
  return new URL(httpUri).host;
}

export function getClusterResourceURI(httpUri: string): Uri {
  const host = getHost(httpUri);
  return Uri.parse(`${scheme}:/cluster-${host}`, true);
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
