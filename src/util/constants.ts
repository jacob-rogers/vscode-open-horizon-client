import { NodeType, SetupOption } from '../types';

export namespace Constants {
  // Common used extension name
  export const extensionName = 'open-horizon-client';

  // Extension data model constants
  export namespace model {
    export const orgObjects = [
      { label: 'Services', type: NodeType.SERVICE },
      { label: 'Nodes', type: NodeType.NODE },
      { label: 'Patterns', type: NodeType.PATTERN },
      { label: 'Policies', type: NodeType.POLICY }
    ];
  };

  // UI constants, used in any window/editor components or elements
  export namespace ui {
    export const inputs = {
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
    };
    export const openDialogs = {
      clusterAccount: {
        uploadEnvFile: {
          title: 'Upload a file with env variables for Cluster Account setup',
          openLabel: 'Add env file',
        }
      }
    };
    export const quickPicks = {
      clusterAccount: {
        setupOptions: {
          title: 'Cluster Account setup options',
        },
        overwrite: {
          title: 'Cluster Account for specified Exchange URL is already configured. Rewrite?',
        },
      },
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
    export const views = {
      horizonTreeDataProvider: {
        id: 'horizonExplorer',
      }
    };
  };

  /* Virtual file system for data model resources and temp files/folders */
  // VFS scheme name (a prefix in resource uris)
  export const vfsScheme = 'hzn';

  // A name of folder mounting at workspace level and containing VFS data
  export const vfsWorkspaceFolderName = 'Horizon virtual file system';
}

