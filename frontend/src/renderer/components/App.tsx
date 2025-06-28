/**
 * Main App component for Image Sorter
 */

import React, { useState } from 'react';
import { AppSettings, ClassItem } from '../../types';
import Controls from './Controls';
import ProgressBar from './ProgressBar';
import ImageGrid from './ImageGrid';
import SettingsModal from './SettingsModal';
import { getImages, classifyImages, undoClassification, ApiError } from '../../services/api';
import { useSettings } from '../../hooks/useSettings';
import { useImageBatch } from '../../hooks/useImageBatch';
import { selectFolder } from '../../utils/fileUtils';



const App: React.FC = () => {
  const { settings, classItems, updateSettings, updateClassItems, updateBoth } = useSettings();
  const { 
    currentBatch, 
    imageStates, 
    remainingImages, 
    loadNextBatch, 
    toggleImageState, 
    clearBatch 
  } = useImageBatch();
  
  // currentFolderはsettings.targetFolderから取得
  const currentFolder = settings.targetFolder;
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [lastMoveData, setLastMoveData] = useState<Array<{source: string; destination: string}> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'main' | 'settings'>('main');

  const handleFolderSelect = async () => {
    try {
      const folder = await selectFolder();
      if (folder) {
        updateSettings({ ...settings, targetFolder: folder });
        setTotalProcessed(0);
        clearBatch();
      }
    } catch (error) {
      console.error('フォルダ選択エラー:', error);
    }
  };

  const handleLoadImages = async () => {
    if (!currentFolder) {
      alert('フォルダを選択してください');
      return;
    }

    setIsLoading(true);
    try {
      const images = await getImages(currentFolder);
      loadNextBatch(images, settings);
    } catch (error) {
      console.error('画像読み込みエラー:', error);
      const message = error instanceof ApiError ? error.message : '画像の読み込みに失敗しました';
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageClick = (imagePath: string, direction: number) => {
    toggleImageState(imagePath, direction, classItems.length);
  };

  const handleClassify = async () => {
    const imagesToClassify = currentBatch.filter(
      image => imageStates[image.path] > 0
    );

    if (imagesToClassify.length === 0) {
      alert('分類する画像を選択してください');
      return;
    }

    if (!currentFolder) {
      alert('対象フォルダが設定されていません');
      return;
    }

    setIsLoading(true);
    try {
      const imagePaths = imagesToClassify.map(image => image.path);
      const labels = imagesToClassify.map(image => 
        classItems[imageStates[image.path] - 1]?.name || ''
      );

      const result = await classifyImages({
        image_paths: imagePaths,
        labels: labels,
        target_folder: currentFolder,
      });

      if (result.success) {
        setLastMoveData(result.moved_files);
        setTotalProcessed(prev => prev + imagesToClassify.length);
        
        // 次のバッチを表示
        loadNextBatch(remainingImages, settings);
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
    if (!lastMoveData || lastMoveData.length === 0) {
      alert('取り消すファイル移動がありません');
      return;
    }

    setIsLoading(true);
    try {
      const result = await undoClassification({
        moved_files: lastMoveData,
      });

      if (result.success) {
        // 取り消し成功後、lastMoveDataをクリア
        setLastMoveData(null);
        setTotalProcessed(prev => Math.max(0, prev - (lastMoveData?.length || 0)));
        
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
    // フックを使って設定を更新（永続化も自動で行われる）
    updateBoth(newSettings, newClassItems);
    setActiveTab('main');

    // グリッドサイズが変更された場合、現在のバッチを再計算
    if (
      newSettings.gridCols !== settings.gridCols ||
      newSettings.gridRows !== settings.gridRows
    ) {
      const allImages = [...currentBatch, ...remainingImages];
      if (allImages.length > 0) {
        loadNextBatch(allImages, newSettings);
      }
    }
  };

  const totalImages = totalProcessed + remainingImages.length + currentBatch.length;
  const progressPercentage = totalImages > 0 ? (totalProcessed / totalImages) * 100 : 0;

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
            canClassify={currentBatch.length > 0}
            canUndo={!!lastMoveData && lastMoveData.length > 0}
            isLoading={isLoading}
          />
          
          <ImageGrid
            images={currentBatch}
            imageStates={imageStates}
            classItems={classItems}
            gridCols={settings.gridCols}
            onImageClick={handleImageClick}
          />
          
          <ProgressBar
            current={totalProcessed}
            total={totalImages}
            percentage={progressPercentage}
          />
        </div>
      ) : (
        <div className="settings-content">
          <SettingsModal
            settings={settings}
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