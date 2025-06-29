/**
 * Folder selector component with drag & drop support
 */

import React, { useRef } from 'react';
import { AppSettings } from '../../types';

export interface FolderSelectorProps {
  settings: AppSettings;
  onSettingsChange: (updates: Partial<AppSettings>) => void;
}

const FolderSelector: React.FC<FolderSelectorProps> = ({
  settings,
  onSettingsChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectFolder = async () => {
    try {
      // IPC経由でフォルダ選択
      const { ipcRenderer } = window.require('electron');
      const folderPath = await ipcRenderer.invoke('select-folder');
      if (folderPath) {
        onSettingsChange({ targetFolder: folderPath });
      }
    } catch (error) {
      console.error('フォルダ選択エラー:', error);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const items = Array.from(e.dataTransfer.items);
    
    for (const item of items) {
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry();
        if (entry && entry.isDirectory) {
          const folderPath = (entry as any).fullPath;
          if (folderPath) {
            onSettingsChange({ targetFolder: folderPath });
            break;
          }
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="folder-selector">
      <div className="form-group">
        <label htmlFor="targetFolder">フォルダパス:</label>
        <div className="folder-input-group">
          <input
            type="text"
            id="targetFolder"
            value={settings.targetFolder || ''}
            onChange={(e) => onSettingsChange({ targetFolder: e.target.value })}
            placeholder="フォルダパスを入力または選択"
            className="form-input folder-path-input"
            readOnly
          />
          <button
            type="button"
            onClick={selectFolder}
            className="folder-select-button"
          >
            選択
          </button>
        </div>
      </div>

      <div
        className="drop-zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        <div className="drop-zone-content">
          <p>📁 フォルダをここにドラッグ&ドロップ</p>
          <p className="drop-zone-subtitle">または上の「選択」ボタンでフォルダを選択</p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        {...({ webkitdirectory: '' } as any)}
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length > 0) {
            const path = files[0].webkitRelativePath.split('/')[0];
            onSettingsChange({ targetFolder: path });
          }
        }}
      />
    </div>
  );
};

export default FolderSelector;