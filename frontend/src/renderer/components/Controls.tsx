/**
 * Control buttons for main actions
 */

import React from 'react';

interface ControlsProps {
  onLoadImages: () => void;
  onClassify: () => void;
  onUndo: () => void;
  canClassify: boolean;
  canUndo: boolean;
  isLoading: boolean;
}

const Controls: React.FC<ControlsProps> = ({
  onLoadImages,
  onClassify,
  onUndo,
  canClassify,
  canUndo,
  isLoading,
}) => {
  return (
    <div className="controls">
      <button 
        className="primary-btn" 
        onClick={onLoadImages}
        disabled={isLoading}
      >
        {isLoading ? '⏳ 読み込み中...' : '🔄 画像読み込み'}
      </button>
      
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
  );
};

export default Controls;