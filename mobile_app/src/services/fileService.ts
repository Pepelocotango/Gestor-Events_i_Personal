import { AppData } from '../types';

export interface IFileService {
  openFile(): Promise<{ uri: string; name: string; content: AppData } | null>;
  saveFile(jsonString: string, uri: string): Promise<void>;
  saveFileAs(jsonString: string, fileName: string): Promise<{ uri: string; name: string } | null>;
}
