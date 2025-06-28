/**
 * Progress bar component
 */

import React from 'react';

export interface ProgressBarProps {
  current: number;
  total: number;
  percentage: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, percentage }) => {
  return (
    <div className="progress-section">
      <div className="status">
        📊 進捗: {current}/{total} ({percentage.toFixed(1)}%)
      </div>
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;