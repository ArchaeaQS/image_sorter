/**
 * Settings modal with tabs for general settings and class management
 */

import React, { useState, useEffect } from 'react';
import { AppSettings, ClassItem } from '../../types';

interface SettingsModalProps {
  settings: AppSettings;
  classItems: ClassItem[];
  onSave: (settings: AppSettings, classItems: ClassItem[], shouldClose?: boolean) => void;
  onClose: () => void;
  isInline?: boolean;
  autoSave?: boolean; // 自動保存フラグ
}


const DEFAULT_COLORS = ['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  classItems,
  onSave,
  onClose,
  isInline = false,
  autoSave = false,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'classes'>('general');
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [localClassItems, setLocalClassItems] = useState<ClassItem[]>([...classItems]);
  const [newClassName, setNewClassName] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // 初期化フラグを設定
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // 自動保存のためのuseEffect
  useEffect(() => {
    if (autoSave && isInitialized) {
      console.log('🔄 自動保存: 設定変更検知');
      const updatedSettings: AppSettings = {
        ...localSettings,
        classLabels: localClassItems.map(item => item.name),
      };
      onSave(updatedSettings, localClassItems, false); // 自動保存はタブを閉じない
    }
  }, [localSettings, localClassItems, autoSave, onSave, isInitialized]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleFolderSelect = async () => {
    try {
      // Webベースのフォルダ選択実装
      const input = document.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true;
      input.multiple = true;
      
      input.onchange = (event) => {
        const files = (event.target as HTMLInputElement).files;
        if (files && files.length > 0) {
          const firstFile = files[0];
          const folderPath = firstFile.webkitRelativePath.split('/')[0];
          console.log('📂 フォルダ選択:', folderPath);
          setLocalSettings(prev => ({ ...prev, targetFolder: folderPath }));
        }
      };
      
      input.click();
    } catch (error) {
      console.error('フォルダ選択エラー:', error);
    }
  };

  const handleAddClass = () => {
    if (!newClassName.trim()) return;
    
    const newClass: ClassItem = {
      id: `class-${Date.now()}`,
      name: newClassName.trim(),
      color: DEFAULT_COLORS[localClassItems.length % DEFAULT_COLORS.length],
      order: localClassItems.length,
    };
    
    setLocalClassItems(prev => [...prev, newClass]);
    setNewClassName('');
  };

  const handleDeleteClass = (id: string) => {
    setLocalClassItems(prev => prev.filter(item => item.id !== id));
  };

  const handleMoveClass = (id: string, direction: 'up' | 'down') => {
    const currentIndex = localClassItems.findIndex(item => item.id === id);
    if (currentIndex === -1) return;

    const newItems = [...localClassItems];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    [newItems[currentIndex], newItems[targetIndex]] = [newItems[targetIndex], newItems[currentIndex]];
    
    // Update order values
    newItems.forEach((item, index) => {
      item.order = index;
    });

    setLocalClassItems(newItems);
  };

  const handleSave = () => {
    const updatedSettings: AppSettings = {
      ...localSettings,
      classLabels: localClassItems.map(item => item.name),
    };
    onSave(updatedSettings, localClassItems, true); // 明示的保存はタブを閉じる
  };

  const folderName = localSettings.targetFolder 
    ? localSettings.targetFolder.split(/[/\\]/).pop() || 'Unknown'
    : 'フォルダが選択されていません';

  const content = (
    <>
      {!isInline && (
        <div className="modal-header">
          <h2>⚙️ 設定</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
      )}

      <div className={isInline ? "inline-modal-body" : "modal-body"}>
          <div className="tab-buttons">
            <button
              className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              🔧 一般設定
            </button>
            <button
              className={`tab-btn ${activeTab === 'classes' ? 'active' : ''}`}
              onClick={() => setActiveTab('classes')}
            >
              🏷️ クラス設定
            </button>
          </div>

          {activeTab === 'general' && (
            <div className="tab-pane active">
              <div className="setting-section">
                <h3>📁 フォルダ設定</h3>
                <div className="setting-item">
                  <label>対象フォルダ:</label>
                  <div className="folder-select">
                    <button className="secondary-btn" onClick={handleFolderSelect}>
                      📂 選択
                    </button>
                    <span className="folder-path" title={localSettings.targetFolder || undefined}>
                      {folderName}
                    </span>
                  </div>
                </div>
              </div>

              <div className="setting-section">
                <h3>🔲 グリッド設定</h3>
                <div className="setting-item">
                  <label>列数:</label>
                  <input
                    type="number"
                    value={localSettings.gridCols}
                    onChange={(e) => setLocalSettings(prev => ({ 
                      ...prev, 
                      gridCols: Math.max(1, Math.min(20, parseInt(e.target.value) || 1))
                    }))}
                    min="1"
                    max="20"
                  />
                </div>
                <div className="setting-item">
                  <label>行数:</label>
                  <input
                    type="number"
                    value={localSettings.gridRows}
                    onChange={(e) => setLocalSettings(prev => ({ 
                      ...prev, 
                      gridRows: Math.max(1, Math.min(20, parseInt(e.target.value) || 1))
                    }))}
                    min="1"
                    max="20"
                  />
                </div>
                <div className="setting-item">
                  <label>バッチサイズ:</label>
                  <span>{localSettings.gridCols * localSettings.gridRows} 枚</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'classes' && (
            <div className="tab-pane active">
              <div className="setting-section">
                <h3>🏷️ クラス管理</h3>
                <div className="class-controls">
                  <div className="add-class">
                    <input
                      type="text"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      placeholder="新しいクラス名"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddClass();
                        }
                      }}
                    />
                    <button className="primary-btn" onClick={handleAddClass}>
                      ➕ 追加
                    </button>
                  </div>
                </div>
                
                <div className="class-list">
                  {localClassItems.length === 0 ? (
                    <div className="empty-state">
                      <p>クラスがありません</p>
                    </div>
                  ) : (
                    localClassItems.map((classItem, index) => (
                      <div key={classItem.id} className="class-item">
                        <div
                          className="class-color"
                          style={{ backgroundColor: classItem.color }}
                        />
                        <div className="class-name">{classItem.name}</div>
                        <div className="class-controls-btn">
                          <button
                            className="move-btn"
                            onClick={() => handleMoveClass(classItem.id, 'up')}
                            disabled={index === 0}
                            title="上に移動"
                          >
                            ↑
                          </button>
                          <button
                            className="move-btn"
                            onClick={() => handleMoveClass(classItem.id, 'down')}
                            disabled={index === localClassItems.length - 1}
                            title="下に移動"
                          >
                            ↓
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteClass(classItem.id)}
                            title="削除"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

      {!isInline && (
        <div className="modal-footer">
          <button className="primary-btn" onClick={handleSave}>
            💾 保存
          </button>
          <button className="secondary-btn" onClick={onClose}>
            ❌ キャンセル
          </button>
        </div>
      )}

      {isInline && (
        <div className="inline-footer">
          <button className="primary-btn" onClick={handleSave}>
            💾 保存してメインに戻る
          </button>
        </div>
      )}
    </>
  );

  if (isInline) {
    return <div className="inline-settings">{content}</div>;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {content}
      </div>
    </div>
  );
};

export default SettingsModal;