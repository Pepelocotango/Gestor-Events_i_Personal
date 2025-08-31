import { AppData } from '../types';

export const validateMigratedData = (data: AppData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.peopleGroups || !Array.isArray(data.peopleGroups)) {
    errors.push("El format de les dades de persones és invàlid.");
  }

  if (!data.eventFrames || !Array.isArray(data.eventFrames)) {
    errors.push("El format de les dades d'esdeveniments és invàlid.");
  }

  if (!data.assignments || !Array.isArray(data.assignments)) {
    errors.push("El format de les dades d'assignacions és invàlid.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
