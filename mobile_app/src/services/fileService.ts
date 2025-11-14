import { AppData } from '../types';

export interface IFileService {
  openFile(): Promise<{ uri: string; name: string; content: AppData } | null>;
  saveFileAs(jsonString: string, fileName: string): Promise<void>;
}
