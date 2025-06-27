/**
 * Main App component for Image Sorter
 */

import React, { useState, useEffect } from 'react';
import { AppState, AppSettings, ImageInfo, ClassItem } from '../../types';
import QuickInfo from './QuickInfo';
import Controls from './Controls';
import ProgressBar from './ProgressBar';
import ImageGrid from './ImageGrid';
import SettingsModal from './SettingsModal';
import { getImages, classifyImages, undoClassification, ApiError } from '../../services/api';


const DEFAULT_SETTINGS: AppSettings = {
  targetFolder: null,
  classLabels: ['テキスト', '図表', '写真'],
  gridCols: 10,
  gridRows: 10,
};

const DEFAULT_CLASS_COLORS = ['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

// 設定の永続化
const STORAGE_KEYS = {
  SETTINGS: 'image-sorter-settings',
  CLASS_ITEMS: 'image-sorter-class-items',
};

const loadSettings = (): AppSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('設定読み込みエラー:', error);
  }
  return DEFAULT_SETTINGS;
};

const loadClassItems = (): ClassItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CLASS_ITEMS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('クラス設定読み込みエラー:', error);
  }
  return DEFAULT_SETTINGS.classLabels.map((label, index) => ({
    id: `class-${index}`,
    name: label,
    color: DEFAULT_CLASS_COLORS[index % DEFAULT_CLASS_COLORS.length],
    order: index,
  }));
};

const saveSettings = (settings: AppSettings) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('設定保存エラー:', error);
  }
};

const saveClassItems = (classItems: ClassItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.CLASS_ITEMS, JSON.stringify(classItems));
  } catch (error) {
    console.error('クラス設定保存エラー:', error);
  }
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    currentFolder: null,
    images: [],
    currentBatch: [],
    imageStates: {},
    totalProcessed: 0,
    lastMoveData: null,
    settings: loadSettings(),
  });

  const [classItems, setClassItems] = useState<ClassItem[]>(loadClassItems());
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'main' | 'settings'>('main');

  // Settings sync effect - update classLabels when classItems change
  useEffect(() => {
    const classLabels = classItems.map(item => item.name);
    setAppState(prev => ({
      ...prev,
      settings: { ...prev.settings, classLabels }
    }));
  }, [classItems]);

  const handleFolderSelect = async () => {
    try {
      // ファイル選択ダイアログの代替実装（仮）
      const input = document.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true;
      input.multiple = true;
      
      input.onchange = (event) => {
        const files = (event.target as HTMLInputElement).files;
        if (files && files.length > 0) {
          // 最初のファイルのパスからフォルダパスを取得
          const firstFile = files[0];
          const folderPath = firstFile.webkitRelativePath.split('/')[0];
          
          setAppState(prev => ({
            ...prev,
            currentFolder: folderPath,
            settings: { ...prev.settings, targetFolder: folderPath },
            totalProcessed: 0,
            images: [],
            currentBatch: [],
            imageStates: {},
          }));
        }
      };
      
      input.click();
    } catch (error) {
      console.error('フォルダ選択エラー:', error);
    }
  };

  const handleLoadImages = async () => {
    if (!appState.currentFolder) {
      alert('フォルダを選択してください');
      return;
    }

    setIsLoading(true);
    try {
      const images = await getImages(appState.currentFolder);
      setAppState(prev => ({
        ...prev,
        images: [...images],
      }));
      displayNextBatch(images, appState.settings);
    } catch (error) {
      console.error('画像読み込みエラー:', error);
      const message = error instanceof ApiError ? error.message : '画像の読み込みに失敗しました';
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  const displayNextBatch = (images: ImageInfo[], settings: AppSettings) => {
    const batchSize = settings.gridCols * settings.gridRows;
    const nextBatch = images.slice(0, batchSize);
    const remainingImages = images.slice(batchSize);

    const newImageStates: { [key: string]: number } = {};
    nextBatch.forEach(image => {
      newImageStates[image.path] = 0; // 未分類状態
    });

    setAppState(prev => ({
      ...prev,
      currentBatch: nextBatch,
      images: remainingImages,
      imageStates: newImageStates,
    }));
  };

  const handleImageClick = (imagePath: string, direction: number) => {
    const currentState = appState.imageStates[imagePath] || 0;
    const maxState = classItems.length;

    let newState: number;
    if (direction > 0) {
      newState = (currentState + 1) % (maxState + 1);
    } else {
      newState = currentState - 1;
      if (newState < 0) newState = maxState;
    }

    setAppState(prev => ({
      ...prev,
      imageStates: {
        ...prev.imageStates,
        [imagePath]: newState,
      },
    }));
  };

  const handleClassify = async () => {
    const imagesToClassify = appState.currentBatch.filter(
      image => appState.imageStates[image.path] > 0
    );

    if (imagesToClassify.length === 0) {
      alert('分類する画像を選択してください');
      return;
    }

    if (!appState.currentFolder) {
      alert('対象フォルダが設定されていません');
      return;
    }

    setIsLoading(true);
    try {
      const imagePaths = imagesToClassify.map(image => image.path);
      const labels = imagesToClassify.map(image => 
        classItems[appState.imageStates[image.path] - 1]?.name || ''
      );

      const result = await classifyImages({
        image_paths: imagePaths,
        labels: labels,
        target_folder: appState.currentFolder,
      });

      if (result.success) {
        setAppState(prev => ({
          ...prev,
          lastMoveData: result.moved_files,
          totalProcessed: prev.totalProcessed + imagesToClassify.length,
        }));
        
        // 次のバッチを表示
        displayNextBatch(appState.images, appState.settings);
      }
    } catch (error) {
      console.error('分類エラー:', error);
      const message = error instanceof ApiError ? error.message : '分類処理に失敗しました';
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUndo = async () => {
    if (!appState.lastMoveData || appState.lastMoveData.length === 0) {
      alert('取り消すファイル移動がありません');
      return;
    }

    setIsLoading(true);
    try {
      const result = await undoClassification({
        moved_files: appState.lastMoveData,
      });

      if (result.success) {
        // 取り消し成功後、lastMoveDataをクリア
        setAppState(prev => ({
          ...prev,
          lastMoveData: null,
          totalProcessed: Math.max(0, prev.totalProcessed - (prev.lastMoveData?.length || 0)),
        }));
        
        alert(`${result.restored_files.length}件のファイルを元に戻しました`);
      }
    } catch (error) {
      console.error('取り消しエラー:', error);
      const message = error instanceof ApiError ? error.message : '取り消し処理に失敗しました';
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = (newSettings: AppSettings, newClassItems: ClassItem[]) => {
    setAppState(prev => ({
      ...prev,
      settings: newSettings,
    }));
    setClassItems(newClassItems);
    setActiveTab('main');

    // 設定を永続化
    saveSettings(newSettings);
    saveClassItems(newClassItems);

    // グリッドサイズが変更された場合、現在のバッチを再計算
    if (
      newSettings.gridCols !== appState.settings.gridCols ||
      newSettings.gridRows !== appState.settings.gridRows
    ) {
      const allImages = [...appState.currentBatch, ...appState.images];
      if (allImages.length > 0) {
        displayNextBatch(allImages, newSettings);
      }
    }
  };

  const totalImages = appState.totalProcessed + appState.images.length + appState.currentBatch.length;
  const progressPercentage = totalImages > 0 ? (appState.totalProcessed / totalImages) * 100 : 0;

  return (
    <div className="app-container">
      
      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-nav-btn ${activeTab === 'main' ? 'active' : ''}`}
          onClick={() => setActiveTab('main')}
        >
          📋 メイン
        </button>
        <button 
          className={`tab-nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ 設定
        </button>
      </div>

      {activeTab === 'main' ? (
        <div className="main-content">
          <Controls
            onLoadImages={handleLoadImages}
            onClassify={handleClassify}
            onUndo={handleUndo}
            canClassify={appState.currentBatch.length > 0}
            canUndo={!!appState.lastMoveData && appState.lastMoveData.length > 0}
            isLoading={isLoading}
          />
          
          <ImageGrid
            images={appState.currentBatch}
            imageStates={appState.imageStates}
            classItems={classItems}
            gridCols={appState.settings.gridCols}
            onImageClick={handleImageClick}
          />
          
          <ProgressBar
            current={appState.totalProcessed}
            total={totalImages}
            percentage={progressPercentage}
          />
        </div>
      ) : (
        <div className="settings-content">
          <SettingsModal
            settings={appState.settings}
            classItems={classItems}
            onSave={handleSaveSettings}
            onClose={() => setActiveTab('main')}
            isInline={true}
          />
        </div>
      )}

    </div>
  );
};

export default App;