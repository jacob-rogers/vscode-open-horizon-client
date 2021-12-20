import { URL } from 'url';
import { Uri } from 'vscode';

const scheme = 'hzn';

export function getHost(exchangeURL: string): string {
  return new URL(exchangeURL).host;
}

export function getClusterResourceURI(host: string): Uri {
  return Uri.parse(`${scheme}://${host}`, true);
}

export function getOrgResourceURI(host: string, orgId: string): Uri {
  const baseUri = getClusterResourceURI(host);
  return baseUri.with({ path: baseUri.path + `/orgs/${orgId}` });
}

export function getNodeResourceURI(host: string, orgId: string, nodeId: string): Uri {
  const baseUri = getOrgResourceURI(host, orgId);
  return baseUri.with({ path: baseUri.path + `/nodes/${nodeId}` });
}

export function getPatternResourceURI(host: string, orgId: string, patternId: string): Uri {
  const baseUri = getOrgResourceURI(host, orgId);
  return baseUri.with({ path: baseUri.path + `/patterns/${patternId}` });
}

export function getPolicyResourceURI(host: string, orgId: string, policyId: string): Uri {
  const baseUri = getOrgResourceURI(host, orgId);
  return baseUri.with({ path: baseUri.path + `/policies/${policyId}` });
}

export function getServiceResourceURI(host: string, orgId: string, serviceId: string): Uri {
  const baseUri = getOrgResourceURI(host, orgId);
  return baseUri.with({ path: baseUri.path + `/services/${serviceId}` });
}
