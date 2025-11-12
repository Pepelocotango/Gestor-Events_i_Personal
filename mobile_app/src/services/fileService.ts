import { AppData } from '../types';

export interface IFileService {
  loadData(): Promise<AppData>;
  saveData(data: AppData, uri: string): Promise<void>;
}
