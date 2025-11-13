import { AppData } from '../types';

export interface IFileService {
  saveData(data: AppData, uri: string): Promise<void>;
}
