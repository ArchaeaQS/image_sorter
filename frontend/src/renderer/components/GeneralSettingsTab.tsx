/**
 * General settings tab component
 */

import React from 'react';
import { AppSettings } from '../../types';
import { GRID_LIMITS, THUMBNAIL_LIMITS } from '../../constants';

export interface GeneralSettingsTabProps {
  settings: AppSettings;
  onSettingsChange: (updates: Partial<AppSettings>) => void;
}

const GeneralSettingsTab: React.FC<GeneralSettingsTabProps> = ({
  settings,
  onSettingsChange,
}) => {
  return (
    <div className="space-y-6">
      <div className="form-group">
        <label htmlFor="gridCols">グリッド列数:</label>
        <input
          type="number"
          id="gridCols"
          min={GRID_LIMITS.MIN_COLS}
          max={GRID_LIMITS.MAX_COLS}
          value={settings.gridCols}
          onChange={(e) => onSettingsChange({ gridCols: parseInt(e.target.value) || GRID_LIMITS.MIN_COLS })}
          className="form-input"
        />
        <small className="text-gray-600">
          ({GRID_LIMITS.MIN_COLS}〜{GRID_LIMITS.MAX_COLS}列)
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="gridRows">グリッド行数:</label>
        <input
          type="number"
          id="gridRows"
          min={GRID_LIMITS.MIN_ROWS}
          max={GRID_LIMITS.MAX_ROWS}
          value={settings.gridRows}
          onChange={(e) => onSettingsChange({ gridRows: parseInt(e.target.value) || GRID_LIMITS.MIN_ROWS })}
          className="form-input"
        />
        <small className="text-gray-600">
          ({GRID_LIMITS.MIN_ROWS}〜{GRID_LIMITS.MAX_ROWS}行)
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="thumbnailHeight">サムネイル高さ:</label>
        <input
          type="number"
          id="thumbnailHeight"
          min={THUMBNAIL_LIMITS.MIN_SIZE}
          max={THUMBNAIL_LIMITS.MAX_SIZE}
          step={10}
          value={settings.thumbnailHeight || THUMBNAIL_LIMITS.DEFAULT_HEIGHT}
          onChange={(e) => onSettingsChange({ thumbnailHeight: parseInt(e.target.value) || THUMBNAIL_LIMITS.DEFAULT_HEIGHT })}
          className="form-input"
        />
        <small className="text-gray-600">
          ({THUMBNAIL_LIMITS.MIN_SIZE}〜{THUMBNAIL_LIMITS.MAX_SIZE}px)
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="thumbnailWidth">サムネイル幅:</label>
        <input
          type="number"
          id="thumbnailWidth"
          min={THUMBNAIL_LIMITS.MIN_SIZE}
          max={THUMBNAIL_LIMITS.MAX_SIZE}
          step={10}
          value={settings.thumbnailWidth || THUMBNAIL_LIMITS.DEFAULT_WIDTH}
          onChange={(e) => onSettingsChange({ thumbnailWidth: parseInt(e.target.value) || THUMBNAIL_LIMITS.DEFAULT_WIDTH })}
          className="form-input"
        />
        <small className="text-gray-600">
          ({THUMBNAIL_LIMITS.MIN_SIZE}〜{THUMBNAIL_LIMITS.MAX_SIZE}px)
        </small>
      </div>
    </div>
  );
};

export default GeneralSettingsTab;