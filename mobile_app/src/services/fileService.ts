import { AppData } from '../types';

export interface IFileService {
  openFile(): Promise<{ uri: string; name: string; content: AppData } | null>;
  createFile(data: AppData, fileName: string): Promise<string | null>;
  saveFile(uri: string, data: AppData): Promise<void>;
}
