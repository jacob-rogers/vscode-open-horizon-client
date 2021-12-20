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
  return getClusterResourceURI(host).with({ path: `/orgs/${orgId}` });
}

export function getNodeResourceURI(host: string, orgId: string, nodeId: string): Uri {
  return getOrgResourceURI(host, orgId).with({ path: `/nodes/${nodeId}` });
}

export function getPatternResourceURI(host: string, orgId: string, patternId: string): Uri {
  return getOrgResourceURI(host, orgId).with({ path: `/patterns/${patternId}` });
}

export function getPolicyResourceURI(host: string, orgId: string, policyId: string): Uri {
  return getOrgResourceURI(host, orgId).with({ path: `/policies/${policyId}` });
}

export function getServiceResourceURI(host: string, orgId: string, serviceId: string): Uri {
  return getOrgResourceURI(host, orgId).with({ path: `/services/${serviceId}` });
}
