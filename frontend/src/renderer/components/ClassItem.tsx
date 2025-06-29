/**
 * Draggable class item component
 */

import React from 'react';
import { ClassItem as ClassItemType } from '../../types';

export interface ClassItemProps {
  item: ClassItemType;
  index: number;
  onColorChange: (id: string, color: string) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetIndex: number) => void;
  onDragEnd: () => void;
  isDraggedItem: boolean;
}

const ClassItem: React.FC<ClassItemProps> = ({
  item,
  index,
  onColorChange,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDraggedItem,
}) => {
  return (
    <div
      className={`class-item ${isDraggedItem ? 'opacity-50' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, item.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
    >
      <div className="class-item-header">
        <span className="drag-handle">⋮⋮</span>
        <span className="class-name">{item.name}</span>
        <button
          type="button"
          className="delete-button"
          onClick={() => onDelete(item.id)}
          title="削除"
        >
          ×
        </button>
      </div>
      
      <div className="color-picker-wrapper">
        <label htmlFor={`color-${item.id}`}>色:</label>
        <input
          type="color"
          id={`color-${item.id}`}
          value={item.color}
          onChange={(e) => onColorChange(item.id, e.target.value)}
          className="color-picker"
        />
      </div>
    </div>
  );
};

export default ClassItem;