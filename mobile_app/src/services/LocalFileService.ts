import { AppData } from '../types';
import { IFileService } from './fileService';
import * as data from '../../assets/data/example_all.json';

export class LocalFileService implements IFileService {
  public loadData(): Promise<AppData> {
    return new Promise((resolve) => {
      // Simulate async loading
      setTimeout(() => {
        const appData: AppData = data as AppData;
        resolve(appData);
      }, 500); // Simulate network delay
    });
  }

  public saveData(data: AppData): Promise<void> {
    // This is a simulated service, so we don't need to implement saving.
    console.log('Simulating saving data...', data);
    return Promise.resolve();
  }
}
