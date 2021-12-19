import {
  CancellationToken, Disposable, Event, EventEmitter, FileDecoration,
  FileDecorationProvider, ProviderResult, ThemeColor, Uri, window,
} from 'vscode';

const enum NodeStatus {
  RUNNING = 'running',
  STOPPED = 'stopped',
};

export class HorizonObjectDecorationProvider implements FileDecorationProvider, Disposable {
  private readonly _onDidChange = new EventEmitter<undefined | Uri | Uri[]>();
  get onDidChange(): Event<undefined | Uri | Uri[]> {
    return this._onDidChange.event;
  }

  private readonly disposable: Disposable;

  constructor() {
    this.disposable = Disposable.from(
      window.registerFileDecorationProvider(this),
    );
  }

  dispose(): void {
    this.disposable.dispose();
  }

  provideFileDecoration(uri: Uri, token: CancellationToken): ProviderResult<FileDecoration> {
    switch (uri.path.split('/')[2]) {
      case 'node':
        return this.provideNodeDecoration(uri, token);
    }

    return undefined;
  }

  provideNodeDecoration(uri: Uri, token: CancellationToken): ProviderResult<FileDecoration> {
    // hzn://some_domain/org1/node/node_name1?status=running
    // hzn://some_domain/org1/node/node_name2?status=stopped
    const status = uri.query.split('&').find((v) => v.includes('status'))?.split('=')[1];

    switch (status as NodeStatus) {
      case NodeStatus.RUNNING:
        return {
          badge: '●',
          color: new ThemeColor('testing.iconPassed'),
          tooltip: 'Running',
        };
      case NodeStatus.STOPPED:
        return {
          badge: '●',
          color: new ThemeColor('testing.iconUnset'),
          tooltip: 'Stopped',
        };
      default:
        return undefined;
    }
  }
}