import { AppData } from '../types';

export interface IFileService {
  loadData(): Promise<{ data: AppData; uri: string; name: string }>;
  saveData(data: AppData, uri: string): Promise<string>;
}
