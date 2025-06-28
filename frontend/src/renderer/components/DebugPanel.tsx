/**
 * Debug panel for settings inspection
 */

import React from 'react';
import { AppSettings, ClassItem } from '../../types';

export interface DebugPanelProps {
  settings: AppSettings;
  classItems: ClassItem[];
  isLoading: boolean;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ settings, classItems, isLoading }) => {
  const handleClearLocalStorage = () => {
    localStorage.removeItem('image-sorter-settings');
    localStorage.removeItem('image-sorter-class-items');
    alert('localStorage をクリアしました。ページをリロードしてください。');
  };

  const handleTestSave = () => {
    const testSettings: AppSettings = {
      targetFolder: '/debug/test/folder',
      classLabels: ['デバッグ1', 'デバッグ2'],
      gridCols: 3,
      gridRows: 3,
    };
    
    localStorage.setItem('image-sorter-settings', JSON.stringify(testSettings));
    alert('テスト設定を保存しました。ページをリロードしてください。');
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: '#f0f0f0', 
      padding: '10px', 
      border: '1px solid #ccc',
      borderRadius: '5px',
      zIndex: 1000,
      maxWidth: '300px',
      fontSize: '12px'
    }}>
      <h3 style={{ margin: '0 0 10px 0' }}>🐛 Debug Panel</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Current Settings:</strong>
        <pre style={{ background: '#fff', padding: '5px', fontSize: '10px', overflow: 'auto', maxHeight: '100px' }}>
          {JSON.stringify(settings, null, 2)}
        </pre>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Class Items:</strong>
        <pre style={{ background: '#fff', padding: '5px', fontSize: '10px', overflow: 'auto', maxHeight: '100px' }}>
          {JSON.stringify(classItems, null, 2)}
        </pre>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>localStorage:</strong>
        <div style={{ fontSize: '10px' }}>
          <div>Settings: {localStorage.getItem('image-sorter-settings') ? '✅' : '❌'}</div>
          <div>Classes: {localStorage.getItem('image-sorter-class-items') ? '✅' : '❌'}</div>
        </div>
      </div>
      
      <div>
        <button 
          onClick={handleTestSave}
          style={{ fontSize: '10px', marginRight: '5px', padding: '2px 5px' }}
        >
          テスト保存
        </button>
        <button 
          onClick={handleClearLocalStorage}
          style={{ fontSize: '10px', padding: '2px 5px' }}
        >
          クリア
        </button>
      </div>
    </div>
  );
};

export default DebugPanel;