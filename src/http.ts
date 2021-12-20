import axios, { AxiosInstance } from 'axios';
import * as https from 'https';
import { URL } from 'url';

import { AuthData } from './auth';

export function httpClient(authData: AuthData): AxiosInstance {
  const { orgId, exchangeUserAuth } = authData.account;
  const [username, password] = exchangeUserAuth.split(':', 2);

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

function getApiBaseUrl(authData: AuthData): URL {
  let baseUrl = authData.account.exchangeURL;
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, baseUrl.length-1);
  }

  return new URL(baseUrl);
}

function getApiBaseOrgUrl(authData: AuthData): URL {
  const baseUrl = getApiBaseUrl(authData);
  baseUrl.pathname = baseUrl.pathname + '/orgs/' + authData.account.orgId;

  return baseUrl;
}

export function getApiNodesUrl(authData: AuthData): string {
  const baseUrl = getApiBaseOrgUrl(authData);
  baseUrl.pathname = baseUrl.pathname + '/nodes';

  return baseUrl.toString();
}

export function getApiPatternsUrl(authData: AuthData): string {
  const baseUrl = getApiBaseOrgUrl(authData);
  baseUrl.pathname = baseUrl.pathname + '/patterns';

  return baseUrl.toString();
}

export function getApiPoliciesUrl(authData: AuthData): string {
  const baseUrl = getApiBaseOrgUrl(authData);
  baseUrl.pathname = baseUrl.pathname + '/business/policies';

  return baseUrl.toString();
}

export function getApiServicesUrl(authData: AuthData): string {
  const baseUrl = getApiBaseOrgUrl(authData);
  baseUrl.pathname = baseUrl.pathname + '/services';

  return baseUrl.toString();
}