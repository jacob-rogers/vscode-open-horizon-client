import {
  Disposable, Event, EventEmitter, FileChangeEvent, FileStat,
  FileSystemError, FileSystemProvider, FileType, ProgressLocation, Uri, window
} from 'vscode';

export class File implements FileStat {

  type: FileType;
  ctime: number;
  mtime: number;
  size: number;

  name: string;
  data?: Uint8Array;

  constructor(name: string) {
    this.type = FileType.File;
    this.ctime = Date.now();
    this.mtime = Date.now();
    this.size = 0;
    this.name = name;
  }
}

export class Directory implements FileStat {

  type: FileType;
  ctime: number;
  mtime: number;
  size: number;

  name: string;
  entries: Map<string, File | Directory>;

  constructor(name: string) {
    this.type = FileType.Directory;
    this.ctime = Date.now();
    this.mtime = Date.now();
    this.size = 0;
    this.name = name;
    this.entries = new Map();
  }
}

export type Entry = File | Directory;

export default class HorizonResourceVFSProvider implements FileSystemProvider {
  root = new Directory('');

  private _emitter = new EventEmitter<FileChangeEvent[]>();

  readonly onDidChangeFile: Event<FileChangeEvent[]> = this._emitter.event;

  watch(uri: Uri, options: { recursive: boolean; excludes: string[]; }): Disposable {
    // ignore, fires for all changes...
    return new Disposable(() => { });
  }

  stat(uri: Uri): FileStat | Thenable<FileStat> {
    return {
      type: FileType.File,
      ctime: 0,
      mtime: 0,
      size: 65536  // These files don't seem to matter for us
    };
  }

  readDirectory(uri: Uri): [string, FileType][] | Thenable<[string, FileType][]> {
    return [];
  }

  createDirectory(uri: Uri): void | Thenable<void> {
    // no-op
  }

  readFile(uri: Uri): Uint8Array | Thenable<Uint8Array> {
    const file = this.readFileAsync(uri);
    if (file) {
      return file;
    }
    throw FileSystemError.FileNotFound();
  }

  async readFileAsync(uri: Uri): Promise<Uint8Array> {
    const content = await this.loadResource(uri);
    return Buffer.from(content, 'utf8');
  }

  async loadResource(uri: Uri): Promise<string> {
    const result = await window.withProgress({
      location: ProgressLocation.Window,
      title: 'Loading resource ...',
    }, (progress, _) => {
      progress.report({ increment: 0 });
      setTimeout(() => {
        progress.report({ increment: 10, message: "I am long running! - still going..." });
      }, 1000);

      setTimeout(() => {
        progress.report({ increment: 40, message: "I am long running! - still going even more..." });
      }, 2000);

      setTimeout(() => {
        progress.report({ increment: 50, message: "I am long running! - almost there..." });
      }, 3000);

      progress.report({ increment: 100 });
      return new Promise<string>((resolve, _) => {
        setTimeout(() => {
          resolve('{\n  "json": true,\n  "kind": "HorizonResource"\n}\n');
        }, 6000);
      });
    });

    return result;
  }

  writeFile(uri: Uri, content: Uint8Array, options: { create: boolean; overwrite: boolean; }): void | Thenable<void> {
    // no-op
  }

  delete(uri: Uri, options: { recursive: boolean; }): void | Thenable<void> {
    // no-op
  }

  rename(oldUri: Uri, newUri: Uri, options: { overwrite: boolean; }): void | Thenable<void> {
    // no-op
  }

}