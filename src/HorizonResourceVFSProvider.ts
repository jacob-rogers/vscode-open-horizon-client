import path = require('path');
import {
  Disposable, Event, EventEmitter, FileChangeEvent, FileChangeType, FileStat,
  FileSystemError, FileSystemProvider, FileType, ProgressLocation, Uri, window,
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

export class HorizonResourceVFSProvider implements FileSystemProvider {
  root = new Directory('');

  private _emitter = new EventEmitter<FileChangeEvent[]>();
  private _bufferedEvents: FileChangeEvent[] = [];
  private _fireSoonHandle?: NodeJS.Timer;

  readonly onDidChangeFile: Event<FileChangeEvent[]> = this._emitter.event;

  private _lookup(uri: Uri, silent: false): Entry;
  private _lookup(uri: Uri, silent: boolean): Entry | undefined;
  private _lookup(uri: Uri, silent: boolean): Entry | undefined {
    const parts = uri.path.split('/');
    let entry: Entry = this.root;
    for (const part of parts) {
      if (!part) {
        continue;
      }
      let child: Entry | undefined;
      if (entry instanceof Directory) {
        child = entry.entries.get(part);
      }
      if (!child) {
        if (!silent) {
          throw FileSystemError.FileNotFound(uri);
        } else {
          return undefined;
        }
      }
      entry = child;
    }
    return entry;
  }

  private _lookupAsFile(uri: Uri, silent: boolean): File {
    const entry = this._lookup(uri, silent);
    if (entry instanceof File) {
      return entry;
    }
    throw FileSystemError.FileIsADirectory(uri);
  }

  private _lookupAsDirectory(uri: Uri, silent: boolean): Directory {
    const entry = this._lookup(uri, silent);
    if (entry instanceof Directory) {
      return entry;
    }
    throw FileSystemError.FileNotADirectory(uri);
  }

  private _lookupParentDirectory(uri: Uri): Directory {
    const dirname = uri.with({ path: path.posix.dirname(uri.path) });
    return this._lookupAsDirectory(dirname, false);
  }

  private _fireSoon(...events: FileChangeEvent[]): void {
    this._bufferedEvents.push(...events);

    if (this._fireSoonHandle) {
      clearTimeout(this._fireSoonHandle);
    }

    this._fireSoonHandle = setTimeout(() => {
      this._emitter.fire(this._bufferedEvents);
      this._bufferedEvents.length = 0;
    }, 5);
  }

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