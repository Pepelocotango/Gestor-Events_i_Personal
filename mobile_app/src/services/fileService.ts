import { AppData } from '../types';

export interface IFileService {
  openFile(): Promise<{ uri: string; name: string; content: AppData } | null>;
  saveFile(uri: string, jsonString: string): Promise<void>;
  saveFileAs(jsonString: string, fileName: string): Promise<void>;
}
