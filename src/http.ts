import axios, { AxiosInstance } from 'axios';
import * as https from 'https';

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