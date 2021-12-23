import axios, { AxiosInstance } from 'axios';
import * as https from 'https';
import { URL } from 'url';

import { HTTPServiceAccount } from './types';

export default function httpClient(serviceAccount: HTTPServiceAccount): AxiosInstance {
  const { orgId, userpass } = serviceAccount;
  const [username, password] = userpass.split(':', 2);

  const agent = new https.Agent({ rejectUnauthorized: false });
  // to make HTTP request work in VS Code extension,
  // this workaround with global agent is needed, see
  // https://stackoverflow.com/questions/69596523/ignoring-axios-error-for-invalid-certificates-when-creating-a-vscode-extension
  https.globalAgent.options.rejectUnauthorized = false;

  const config = {
    httpsAgent: agent,
    auth: {
      username: `${orgId}/${username}`,
      password,
    }
  };

  return axios.create(config);
}

function getApiBaseUrl(serviceAccount: HTTPServiceAccount): URL {
  let baseUrl = serviceAccount.baseUrl;
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, baseUrl.length - 1);
  }

  return new URL(baseUrl);
}

function getApiBaseOrgUrl(serviceAccount: HTTPServiceAccount): URL {
  const baseUrl = getApiBaseUrl(serviceAccount);
  baseUrl.pathname = baseUrl.pathname + '/orgs/' + serviceAccount.orgId;

  return baseUrl;
}

export function getApiNodesUrl(serviceAccount: HTTPServiceAccount): string {
  const baseUrl = getApiBaseOrgUrl(serviceAccount);
  baseUrl.pathname = baseUrl.pathname + '/nodes';

  return baseUrl.toString();
}

export function getApiPatternsUrl(serviceAccount: HTTPServiceAccount): string {
  const baseUrl = getApiBaseOrgUrl(serviceAccount);
  baseUrl.pathname = baseUrl.pathname + '/patterns';

  return baseUrl.toString();
}

export function getApiPoliciesUrl(serviceAccount: HTTPServiceAccount): string {
  const baseUrl = getApiBaseOrgUrl(serviceAccount);
  baseUrl.pathname = baseUrl.pathname + '/business/policies';

  return baseUrl.toString();
}

export function getApiServicesUrl(serviceAccount: HTTPServiceAccount): string {
  const baseUrl = getApiBaseOrgUrl(serviceAccount);
  baseUrl.pathname = baseUrl.pathname + '/services';

  return baseUrl.toString();
}