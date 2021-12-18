import { ExtensionContext, SecretStorage, Uri, workspace } from 'vscode';
import { getHorizonEnvFilePath } from './utils';

export interface AuthData {
  account: {
    // Required keys
    orgId: string;
    exchangeUserAuth: string;
    exchangeURL: string;
    cssURL: string;
    mgmtHubCertPath: string;

    // Optional keys
    publicKey?: string;
    privateKey?: string;
    agentNamespace?: string;
  }
}

interface Env {
  [key: string]: string;
}

export class AuthSettings {
  private static _instance: AuthSettings;

  constructor(private secretStorage: SecretStorage) { }

  static init(context: ExtensionContext) {
    AuthSettings._instance = new AuthSettings(context.secrets);
  }

  static get instance(): AuthSettings {
    return AuthSettings._instance;
  }

  async storeAuthData(authData?: AuthData): Promise<void> {
    if (authData) {
      const hexValue = Buffer.from(JSON.stringify(authData)).toString('hex');
      this.secretStorage.store('open-horizon.authData', hexValue);
    }
  }

  async getAuthData(): Promise<AuthData> {
    const env = await this._readFromEnvFile();
    const authData: AuthData = {
      account: {
        orgId: env?.['HZN_ORG_ID'] || '',
        exchangeUserAuth: env?.['HZN_EXCHANGE_USER_AUTH'] || '',
        exchangeURL: env?.['HZN_EXCHANGE_URL'] || '',
        cssURL: env?.['HZN_FSS_CSSURL'] || '',
        mgmtHubCertPath: env?.['HZN_MGMT_HUB_CERT_PATH'] || '',

        publicKey: '$HOME/.hzn/keys/service.public.pem',
        privateKey: '$HOME/.hzn/keys/service.private.key',
        agentNamespace: 'default',
      },
    };
    return authData;
  }

  private async _readFromEnvFile(): Promise<Env | undefined> {
    const horizonEnvFilePath = getHorizonEnvFilePath();
    if (typeof horizonEnvFilePath !== 'string') {
      return undefined;
    }

    const uri = Uri.file(horizonEnvFilePath);

    return new Promise(async (resolve, reject) => {
      const dataBytes = await workspace.fs.readFile(uri);
      if (!dataBytes) {
        resolve(undefined);
      }

      const dataStr = Buffer.from(dataBytes.buffer).toString();
      const env: Env = {};
      const kvpairs = dataStr.split('\n');
      kvpairs.forEach((kvpair) => {
        if (!kvpair.trim().startsWith('#')) {
          const [key, value] = kvpair.split('=', 2);
          env[key.trim()] = value;
        }
      });

      resolve(env);
    });
  }
}
