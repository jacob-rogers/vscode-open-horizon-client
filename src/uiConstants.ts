/* eslint-disable @typescript-eslint/naming-convention */
export enum SetupOption {
  INTERACTIVE,
  FILE,
};

export const setupOptionItems = [
  {
    id: SetupOption.INTERACTIVE,
    label: 'Set up Cluster Account props using interactive inputs',
    detail: `Shows step-by-step user input boxes`,
  },
  {
    id: SetupOption.FILE,
    label: 'Load from .env file',
    detail: `Shows an open file dialog, accepts a file with env vars in key=value format`,
  },
];

export default {
  inputs: {
    clusterAccount: {
      name: {
        key: 'cluster-name',
        title: 'Cluster name',
        placeholder: 'e.g. "Globex Corp. cluster"',
      },
      description: {
        key: 'cluster-description',
        title: 'Cluster description',
        placeholder: 'e.g. "Cluster for Globex Corp. edge devices management"',
      },
      exchangeURL: {
        key: 'cluster-exchangeUrl',
        title: 'Cluster Exchange URL',
        placeholder: 'e.g. "https://cluster1.mycompany.com/edge-exchange/v1/"',
      },
      orgId: {
        key: 'cluster-orgId',
        title: 'Cluster organization ID',
        placeholder: 'e.g. "myorg"',
      },
      cssURL: {
        key: 'cluster-cssUrl',
        title: 'Cluster CSS URL',
        placeholder: 'e.g. "https://cluster1.mycompany.com/edge-css/v1/"',
      },
      agbotURL: {
        key: 'cluster-agbotUrl',
        title: 'Cluster Agbot URL',
        placeholder: 'e.g. "https://cluster1.mycompany.com/edge-agbot/v1/"',
      },
      exchangeUserAuth: {
        key: 'cluster-exchangeUserAuth',
        title: 'Cluster Exchange user auth credentials',
        placeholder: 'e.g. "user1:some_password"',
      }
    },
  },
  openDialogs: {
    clusterAccount: {
      uploadEnvFile: {
        title: 'Upload a file with env variables for Cluster Account setup',
        openLabel: 'Add env file',
      }
    }
  },
  quickPicks: {
    clusterAccount: {
      setupOptions: {
        title: 'Cluster Account setup options',
      },
      overwrite: {
        title: 'Cluster Account for specified Exchange URL is already configured. Rewrite?',
      },
    },
  },
};
