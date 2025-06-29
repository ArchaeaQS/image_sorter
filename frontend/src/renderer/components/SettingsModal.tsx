/**
 * Settings modal with tabs for general settings and class management
 */

import React, { useState, useEffect } from 'react';
import { AppSettings, ClassItem } from '../../types';
import { DEFAULT_COLORS, GRID_LIMITS, THUMBNAIL_LIMITS, DEBOUNCE_DELAYS } from '../../constants';

export interface SettingsModalProps {
  settings: AppSettings;
  classItems: ClassItem[];
  onSave: (settings: AppSettings, classItems: ClassItem[], shouldClose?: boolean) => void;
  onClose: () => void;
  isInline?: boolean;
  autoSave?: boolean; // 自動保存フラグ
}



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
  const [isSaving, setIsSaving] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  // 初期化フラグを設定
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // 自動保存のためのuseEffect（デバウンス付き）
  useEffect(() => {
    if (autoSave && isInitialized && !isSaving) {
      console.log('🔄 自動保存: 設定変更検知');
      
      const timeoutId = setTimeout(async () => {
        setIsSaving(true);
        try {
          const updatedSettings: AppSettings = {
            ...localSettings,
            classLabels: localClassItems.map(item => item.name),
          };
          await onSave(updatedSettings, localClassItems, false); // 自動保存はタブを閉じない
          console.log('✅ 自動保存完了');
        } catch (error) {
          console.error('❌ 自動保存エラー:', error);
        } finally {
          setIsSaving(false);
        }
      }, DEBOUNCE_DELAYS.AUTO_SAVE);
      
      return () => clearTimeout(timeoutId);
    }
  }, [localSettings, localClassItems, autoSave, onSave, isInitialized, isSaving]);

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
      console.log('📂 フォルダ選択ダイアログを開く...');
      
      // ElectronのIPCを使ってネイティブダイアログを表示
      const { ipcRenderer } = window.require('electron');
      const folderPath = await ipcRenderer.invoke('select-folder');
      
      console.log('📂 選択されたフォルダ:', folderPath);
      
      if (folderPath) {
        // UI を即座に更新
        setLocalSettings(prev => ({ ...prev, targetFolder: folderPath }));
        
        // 自動保存が無効の場合は即座に保存
        if (!autoSave) {
          const updatedSettings: AppSettings = {
            ...localSettings,
            targetFolder: folderPath,
            classLabels: localClassItems.map(item => item.name),
          };
          onSave(updatedSettings, localClassItems, false);
        }
      } else {
        console.log('📂 フォルダ選択がキャンセルされました');
      }
    } catch (error) {
      console.error('❌ フォルダ選択エラー:', error);
      
      // フォールバック: Webベースのフォルダ選択
      console.log('🔄 Webベースのフォルダ選択にフォールバック');
      const input = document.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true;
      input.multiple = true;
      
      input.onchange = (event) => {
        const files = (event.target as HTMLInputElement).files;
        if (files && files.length > 0) {
          const firstFile = files[0];
          // フォルダ名だけでなく、可能な限りパス情報を取得
          const relativePath = firstFile.webkitRelativePath;
          const folderName = relativePath.split('/')[0];
          console.log('📂 Webベースで選択:', folderName, '(相対パス:', relativePath, ')');
          
          setLocalSettings(prev => ({ ...prev, targetFolder: folderName }));
          
          if (!autoSave) {
            const updatedSettings: AppSettings = {
              ...localSettings,
              targetFolder: folderName,
              classLabels: localClassItems.map(item => item.name),
            };
            onSave(updatedSettings, localClassItems, false);
          }
        }
      };
      
      input.click();
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


  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItemId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (!draggedItemId || draggedItemId === targetId) return;

    // リアルタイムでアイテムの位置を更新
    const sourceIndex = localClassItems.findIndex(item => item.id === draggedItemId);
    const targetIndex = localClassItems.findIndex(item => item.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    const newItems = [...localClassItems];
    const [movedItem] = newItems.splice(sourceIndex, 1);
    newItems.splice(targetIndex, 0, movedItem);

    // Update order values
    newItems.forEach((item, index) => {
      item.order = index;
    });

    setLocalClassItems(newItems);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDraggedItemId(null);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
  };


  // 絶対パスをそのまま表示（長い場合は省略表示）
  const displayPath = localSettings.targetFolder || 'フォルダが選択されていません';
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
                      {displayPath}
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
                      gridCols: Math.max(GRID_LIMITS.MIN_COLS, Math.min(GRID_LIMITS.MAX_COLS, parseInt(e.target.value) || 1))
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
                      gridRows: Math.max(GRID_LIMITS.MIN_ROWS, Math.min(GRID_LIMITS.MAX_ROWS, parseInt(e.target.value) || 1))
                    }))}
                    min="1"
                    max="20"
                  />
                </div>
                <div className="setting-item">
                  <label>バッチサイズ:</label>
                  <span>{localSettings.gridCols * localSettings.gridRows} 枚</span>
                </div>
                <div className="setting-item">
                  <label>サムネイル高さ:</label>
                  <input
                    type="range"
                    min={THUMBNAIL_LIMITS.MIN_SIZE}
                    max={THUMBNAIL_LIMITS.MAX_SIZE}
                    value={localSettings.thumbnailHeight || THUMBNAIL_LIMITS.DEFAULT_HEIGHT}
                    onChange={(e) => setLocalSettings(prev => ({ 
                      ...prev, 
                      thumbnailHeight: parseInt(e.target.value)
                    }))}
                  />
                  <span>{localSettings.thumbnailHeight || THUMBNAIL_LIMITS.DEFAULT_HEIGHT}px</span>
                </div>
                <div className="setting-item">
                  <label>サムネイル幅:</label>
                  <input
                    type="range"
                    min={THUMBNAIL_LIMITS.MIN_SIZE}
                    max={THUMBNAIL_LIMITS.MAX_SIZE}
                    value={localSettings.thumbnailWidth || THUMBNAIL_LIMITS.DEFAULT_WIDTH}
                    onChange={(e) => setLocalSettings(prev => ({ 
                      ...prev, 
                      thumbnailWidth: parseInt(e.target.value)
                    }))}
                  />
                  <span>{localSettings.thumbnailWidth || THUMBNAIL_LIMITS.DEFAULT_WIDTH}px</span>
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
                      <div 
                        key={classItem.id} 
                        className={`class-item ${draggedItemId === classItem.id ? 'dragging' : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, classItem.id)}
                        onDragOver={(e) => handleDragOver(e, classItem.id)}
                        onDrop={(e) => handleDrop(e, classItem.id)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="drag-handle">⋮⋮</div>
                        <input
                          type="color"
                          className="class-color-picker"
                          value={classItem.color}
                          onChange={(e) => {
                            const newColor = e.target.value;
                            setLocalClassItems(prev => 
                              prev.map(item => 
                                item.id === classItem.id 
                                  ? { ...item, color: newColor }
                                  : item
                              )
                            );
                          }}
                          title="色を変更"
                        />
                        <div className="class-name">{classItem.name}</div>
                        <div className="class-controls-btn">
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