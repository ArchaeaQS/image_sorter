/**
 * Quick info bar showing current settings
 */

import React from 'react';

interface QuickInfoProps {
  folder: string | null;
  gridSize: string;
  classCount: number;
}

const QuickInfo: React.FC<QuickInfoProps> = ({ folder, gridSize, classCount }) => {
  const folderName = folder ? folder.split(/[/\\]/).pop() || 'Unknown' : 'フォルダが選択されていません';

  return (
    <div className="quick-info">
      <div className="info-item">
        <label>📁 対象フォルダ</label>
        <span title={folder || undefined}>{folderName}</span>
      </div>
      <div className="info-item">
        <label>🔲 グリッド</label>
        <span>{gridSize}</span>
      </div>
      <div className="info-item">
        <label>🏷️ クラス数</label>
        <span>{classCount}</span>
      </div>
    </div>
  );
};

export default QuickInfo;