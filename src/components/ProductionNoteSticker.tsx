import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Tooltip from './ui/Tooltip';

interface ProductionNoteStickerProps {
  note?: string;
  onEdit?: (newNote: string) => void;
}

const ProductionNoteSticker: React.FC<ProductionNoteStickerProps> = ({ 
  note, 
  onEdit 
}) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(note || '');

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que es propagui al click del títol
    if (onEdit) {
      setIsEditing(true);
      setEditValue(note || '');
    }
  };

  const handleSave = () => {
    if (onEdit) {
      onEdit(editValue.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(note || '');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <input
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="px-2 py-1 text-xs rounded border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring max-w-[150px]"
        placeholder={t('production_note.placeholder')}
        autoFocus
      />
    );
  }

  if (!note) {
    return (
      <Tooltip text={t('production_note.tooltip')}>
        <div
          onDoubleClick={handleDoubleClick}
          className="px-2 py-1 text-xs rounded cursor-pointer transition-colors duration-200 border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground hover:bg-muted/50"
        >
          + {t('production_note.add')}
        </div>
      </Tooltip>
    );
  }

  return (
    <Tooltip text={note}>
      <div
        onDoubleClick={handleDoubleClick}
        className="px-2 py-1 text-xs rounded cursor-pointer transition-colors duration-200 whitespace-nowrap overflow-hidden max-w-[150px] bg-destructive/50 text-foreground hover:bg-destructive/60 border border-border"
      >
        {note}
      </div>
    </Tooltip>
  );
};

export default ProductionNoteSticker;
