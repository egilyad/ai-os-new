import type { KvRepository } from './types';

const HANDLE_KV_KEY = 'workspace_handle';

export class WorkspaceRepository {
  constructor(private kv: KvRepository) {}

  async saveHandle(handle: FileSystemDirectoryHandle): Promise<void> {
    await this.kv.set(HANDLE_KV_KEY, handle);
  }

  async getHandle(): Promise<FileSystemDirectoryHandle | null> {
    return this.kv.get<FileSystemDirectoryHandle>(HANDLE_KV_KEY);
  }

  async deleteHandle(): Promise<void> {
    await this.kv.delete(HANDLE_KV_KEY);
  }
}
