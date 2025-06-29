/**
 * Class management tab component
 */

import React, { useState } from 'react';
import { ClassItem as ClassItemType } from '../../types';
import { DEFAULT_COLORS } from '../../constants';
import ClassItem from './ClassItem';

export interface ClassManagementTabProps {
  classItems: ClassItemType[];
  onClassItemsChange: (items: ClassItemType[]) => void;
}

const ClassManagementTab: React.FC<ClassManagementTabProps> = ({
  classItems,
  onClassItemsChange,
}) => {
  const [newClassName, setNewClassName] = useState('');
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  const addNewClass = () => {
    if (newClassName.trim()) {
      const nextColorIndex = classItems.length % DEFAULT_COLORS.length;
      const newItem: ClassItemType = {
        id: Date.now().toString(),
        name: newClassName.trim(),
        color: DEFAULT_COLORS[nextColorIndex],
        order: classItems.length,
      };
      onClassItemsChange([...classItems, newItem]);
      setNewClassName('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addNewClass();
    }
  };

  const deleteClass = (id: string) => {
    onClassItemsChange(classItems.filter(item => item.id !== id));
  };

  const updateClassColor = (id: string, color: string) => {
    onClassItemsChange(
      classItems.map(item =>
        item.id === id ? { ...item, color } : item
      )
    );
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItemId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (!draggedItemId) return;

    const draggedIndex = classItems.findIndex(item => item.id === draggedItemId);
    if (draggedIndex === -1 || draggedIndex === targetIndex) return;

    const newItems = [...classItems];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);
    
    onClassItemsChange(newItems);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
  };

  return (
    <div className="space-y-6">
      <div className="form-group">
        <label htmlFor="newClassName">新しいクラス名:</label>
        <div className="new-class-input-group">
          <input
            type="text"
            id="newClassName"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="クラス名を入力"
            className="form-input"
          />
          <button
            type="button"
            onClick={addNewClass}
            disabled={!newClassName.trim()}
            className="add-button"
          >
            追加
          </button>
        </div>
      </div>

      <div className="classes-list">
        <h4>クラス一覧 (ドラッグで並び替え):</h4>
        <div className="classes-container">
          {classItems.map((item, index) => (
            <ClassItem
              key={item.id}
              item={item}
              index={index}
              onColorChange={updateClassColor}
              onDelete={deleteClass}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              isDraggedItem={draggedItemId === item.id}
            />
          ))}
        </div>
        
        {classItems.length === 0 && (
          <p className="no-classes-message">
            クラスが設定されていません。上記で新しいクラスを追加してください。
          </p>
        )}
      </div>
    </div>
  );
};

export default ClassManagementTab;