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

  const handleDoubleClick = () => {
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
    return null;
  }

  return (
    <Tooltip text={note}>
      <div
        onDoubleClick={handleDoubleClick}
        className="px-2 py-1 text-xs rounded cursor-pointer transition-colors duration-200 whitespace-nowrap overflow-hidden max-w-[150px] bg-card text-card-foreground hover:bg-muted border border-border"
        title={t('production_note.tooltip')}
      >
        {note}
      </div>
    </Tooltip>
  );
};

export default ProductionNoteSticker;
