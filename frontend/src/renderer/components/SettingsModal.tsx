/**
 * Refactored Settings modal with separated components
 */

import React, { useState, useEffect } from 'react';
import { AppSettings, ClassItem } from '../../types';
import { DEBOUNCE_DELAYS } from '../../constants';
import GeneralSettingsTab from './GeneralSettingsTab';
import ClassManagementTab from './ClassManagementTab';
import FolderSelector from './FolderSelector';

export interface SettingsModalProps {
  settings: AppSettings;
  classItems: ClassItem[];
  onSave: (settings: AppSettings, classItems: ClassItem[], shouldClose?: boolean) => void;
  onClose: () => void;
  isInline?: boolean;
  autoSave?: boolean;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  classItems,
  onSave,
  onClose,
  isInline = false,
  autoSave = false,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'classes' | 'folder'>('general');
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [localClassItems, setLocalClassItems] = useState<ClassItem[]>([...classItems]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 初期化
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // 自動保存（デバウンス付き）
  useEffect(() => {
    if (autoSave && isInitialized && !isSaving) {
      const timeoutId = setTimeout(async () => {
        setIsSaving(true);
        try {
          const updatedSettings: AppSettings = {
            ...localSettings,
            classLabels: localClassItems.map(item => item.name),
          };
          await onSave(updatedSettings, localClassItems, false);
        } catch (error) {
          console.error('自動保存エラー:', error);
        } finally {
          setIsSaving(false);
        }
      }, DEBOUNCE_DELAYS.AUTO_SAVE);
      
      return () => clearTimeout(timeoutId);
    }
  }, [localSettings, localClassItems, autoSave, onSave, isInitialized, isSaving]);

  // ESCキーでクローズ
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSettingsChange = (updates: Partial<AppSettings>) => {
    setLocalSettings(prev => ({ ...prev, ...updates }));
  };

  const handleClassItemsChange = (items: ClassItem[]) => {
    setLocalClassItems(items);
  };

  const handleSave = () => {
    const updatedSettings: AppSettings = {
      ...localSettings,
      classLabels: localClassItems.map(item => item.name),
    };
    onSave(updatedSettings, localClassItems, true);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <GeneralSettingsTab
            settings={localSettings}
            onSettingsChange={handleSettingsChange}
          />
        );
      case 'classes':
        return (
          <ClassManagementTab
            classItems={localClassItems}
            onClassItemsChange={handleClassItemsChange}
          />
        );
      case 'folder':
        return (
          <FolderSelector
            settings={localSettings}
            onSettingsChange={handleSettingsChange}
          />
        );
      default:
        return null;
    }
  };

  if (isInline) {
    return (
      <div className="settings-inline">
        <div className="settings-tabs">
          <button
            className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            一般
          </button>
          <button
            className={`tab-button ${activeTab === 'classes' ? 'active' : ''}`}
            onClick={() => setActiveTab('classes')}
          >
            クラス管理
          </button>
          <button
            className={`tab-button ${activeTab === 'folder' ? 'active' : ''}`}
            onClick={() => setActiveTab('folder')}
          >
            フォルダ
          </button>
        </div>
        
        <div className="settings-content">
          {renderTabContent()}
        </div>
        
        {autoSave && (
          <div className="auto-save-status">
            {isSaving ? '💾 保存中...' : '✅ 自動保存有効'}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>設定</h2>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        <div className="settings-tabs">
          <button
            className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            一般
          </button>
          <button
            className={`tab-button ${activeTab === 'classes' ? 'active' : ''}`}
            onClick={() => setActiveTab('classes')}
          >
            クラス管理
          </button>
          <button
            className={`tab-button ${activeTab === 'folder' ? 'active' : ''}`}
            onClick={() => setActiveTab('folder')}
          >
            フォルダ
          </button>
        </div>

        <div className="modal-body">
          {renderTabContent()}
        </div>

        <div className="modal-footer">
          {autoSave && (
            <div className="auto-save-status">
              {isSaving ? '💾 保存中...' : '✅ 自動保存有効'}
            </div>
          )}
          
          <div className="button-group">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="save-button"
              disabled={isSaving}
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;