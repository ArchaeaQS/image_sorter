/**
 * Control buttons for main actions
 */

import React from 'react';

export interface ControlsProps {
  onSettingsClick: () => void;
  onClassify: () => void;
  onUndo: () => void;
  canClassify: boolean;
  canUndo: boolean;
  isLoading: boolean;
  currentFolder?: string | null;
}

const Controls: React.FC<ControlsProps> = ({
  onSettingsClick,
  onClassify,
  onUndo,
  canClassify,
  canUndo,
  isLoading,
  currentFolder,
}) => {
  return (
    <div className="app-header">
      <button 
        className="settings-btn"
        onClick={onSettingsClick}
      >
        ⚙️ 設定
      </button>
      
      <div className="current-folder-display">
        <span className="folder-label">📁 対象フォルダ:</span>
        <span className="folder-path" title={currentFolder || 'フォルダが選択されていません'}>
          {currentFolder || 'フォルダが選択されていません'}
        </span>
      </div>
      
      <div className="header-actions">
        <button 
          className="primary-btn" 
          onClick={onClassify}
          disabled={!canClassify || isLoading}
        >
          {isLoading ? '⏳ 処理中...' : '✨ 分類実行'}
        </button>
        
        <button 
          className="secondary-btn" 
          onClick={onUndo}
          disabled={!canUndo || isLoading}
        >
          ↶ 取り消し
        </button>
      </div>
    </div>
  );
};

export default Controls;