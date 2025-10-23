import React, { useState, useEffect, FormEvent } from 'react';
import { MaterialItem } from '../../types';
import Tooltip from '../ui/Tooltip';
import AutosizeTextarea from '../ui/AutosizeTextarea';

// Defineix les propietats que el component acceptarà
export interface MaterialFormProps {
  initialData?: Partial<MaterialItem>;
  onSubmit: (data: Omit<MaterialItem, 'id'>) => void;
  onCancel?: () => void;
  submitButtonText?: string;
  categories?: string[];
  locations?: string[];
  materialItems?: MaterialItem[]; // Llista completa per a la validació
}

const MaterialForm: React.FC<MaterialFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  submitButtonText = 'Desar',
  categories = [],
  locations = [],
  materialItems = [],
}) => {
  // Estats interns per als camps del formulari
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState(1);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const commonInputClass = "mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm";

  // Efecte per omplir el formulari quan initialData canvia (mode edició)
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setCategory(initialData.category || '');
      setStock(initialData.stock || 1);
      setLocation(initialData.location || '');
      setNotes(initialData.notes || '');
    } else {
      // Reseteja el formulari si no hi ha dades inicials
      setName('');
      setCategory('');
      setStock(1);
      setLocation('');
      setNotes('');
    }
  }, [initialData]);

  // Funció de validació
  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) {
        newErrors.name = "El nom és obligatori.";
    } else {
        const isDuplicate = materialItems.some(item =>
            item.name.toLowerCase() === name.trim().toLowerCase() &&
            item.id !== initialData?.id
        );
        if (isDuplicate) {
            newErrors.name = "Ja existeix un material amb aquest nom.";
        }
    }
    if (!category.trim()) newErrors.category = "La categoria és obligatòria.";
    if (stock < 0) newErrors.stock = "L'estoc no pot ser negatiu.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestor de l'enviament del formulari
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const itemData = {
      name,
      category,
      stock: Number(stock),
      location,
      notes,
    };
    onSubmit(itemData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="mat-name" className="block text-sm font-medium text-muted-foreground">Nom</label>
        <Tooltip text="Nom de l'ítem de material">
          <input
            type="text"
            id="mat-name"
            value={name}
            onChange={e => setName(e.target.value)}
            className={commonInputClass}
            required
          />
        </Tooltip>
        {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="mat-category" className="block text-sm font-medium text-muted-foreground">Categoria</label>
        <Tooltip text="Categoria a la que pertany l'ítem">
          <input
            type="text"
            id="mat-category"
            value={category}
            onChange={e => setCategory(e.target.value)}
            className={commonInputClass}
            list="category-suggestions"
            required
          />
        </Tooltip>
        <datalist id="category-suggestions">
          {categories.map((cat: string) => <option key={cat} value={cat} />)}
        </datalist>
        {errors.category && <p className="text-destructive text-xs mt-1">{errors.category}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="mat-stock" className="block text-sm font-medium text-muted-foreground">Estoc</label>
          <Tooltip text="Quantitat total d'aquest ítem en inventari">
            <input
              type="number"
              id="mat-stock"
              value={stock}
              onChange={e => setStock(Number(e.target.value))}
              className={commonInputClass}
              min="0"
              required
            />
          </Tooltip>
          {errors.stock && <p className="text-destructive text-xs mt-1">{errors.stock}</p>}
        </div>
        <div>
          <label htmlFor="mat-location" className="block text-sm font-medium text-muted-foreground">Ubicació</label>
          <Tooltip text="On es guarda aquest ítem (opcional)">
            <input
              type="text"
              id="mat-location"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className={commonInputClass}
              list="location-suggestions"
            />
          </Tooltip>
          <datalist id="location-suggestions">
            {locations.map((loc: string) => <option key={loc} value={loc} />)}
          </datalist>
        </div>
      </div>

      <div>
        <label htmlFor="mat-notes" className="block text-sm font-medium text-muted-foreground">Notes</label>
        <Tooltip text="Anotacions addicionals sobre l'ítem (opcional)">
          <AutosizeTextarea
            id="mat-notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className={`${commonInputClass} resize-none overflow-hidden`}
            rows={3}
          />
        </Tooltip>
      </div>

      <div className="flex justify-end space-x-2 pt-2">
        {onCancel && (
          <Tooltip text="Descartar canvis i netejar el formulari">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-accent rounded-md"
            >
              Cancel·lar
            </button>
          </Tooltip>
        )}
        <Tooltip text={submitButtonText === 'Actualitzar' ? 'Desar els canvis fets a l\'ítem' : 'Afegir el nou ítem a l\'inventari'}>
          <button
            type="submit"
            className="px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md"
          >
            {submitButtonText}
          </button>
        </Tooltip>
      </div>
    </form>
  );
};

export default MaterialForm;
