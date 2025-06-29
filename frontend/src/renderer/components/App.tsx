/**
 * Main App component for Image Sorter
 */

import React, { useState } from "react";
import { AppSettings, ClassItem } from "../../types";
import ProgressBar from "./ProgressBar";
import ImageGrid from "./ImageGrid";
import SettingsModal from "./SettingsModal";
import Controls from "./Controls";
import DebugPanel from "./DebugPanel";
import { useSettingsFile } from "../../hooks/useSettingsFile";
import { useImageBatch } from "../../hooks/useImageBatch";
import { useImageClassification } from "../hooks/useImageClassification";
import { useImageLoader } from "../hooks/useImageLoader";

const App: React.FC = () => {
  const {
    settings,
    classItems,
    updateSettings,
    updateBoth,
    isLoading: settingsLoading,
  } = useSettingsFile();
  const {
    currentBatch,
    imageStates,
    remainingImages,
    totalImagesCount,
    loadNextBatch,
    toggleImageState,
    clearBatch,
  } = useImageBatch();

  // カスタムフック
  const {
    totalProcessed,
    setTotalProcessed,
    lastMoveData,
    setLastMoveData,
    isLoading: classificationLoading,
    handleClassify,
    handleUndo,
  } = useImageClassification();

  const {
    isLoading: imageLoading,
    handleLoadImages,
    useAutoImageLoader,
  } = useImageLoader();

  // currentFolderはsettings.targetFolderから取得
  const currentFolder = settings.targetFolder;
  const [showSettings, setShowSettings] = useState(false);
  const isLoading = classificationLoading || imageLoading;

  // 自動画像読み込みのセットアップ
  useAutoImageLoader(
    currentFolder,
    currentBatch,
    remainingImages,
    settingsLoading,
    loadNextBatch,
    settings
  );

  const handleImageClick = (imagePath: string, direction: number) => {
    toggleImageState(imagePath, direction, classItems.length);
  };

  // 分類実行のハンドラー
  const handleClassifyClick = () => {
    handleClassify(
      currentBatch,
      imageStates,
      classItems,
      currentFolder,
      remainingImages,
      loadNextBatch,
      settings
    );
  };

  const handleUndoClick = () => {
    handleUndo(currentFolder, () => {
      // Undo完了後に画像リストを再読み込み
      if (currentFolder) {
        console.log("🔄 Undo後の画像リスト再読み込み");
        handleLoadImages(currentFolder, loadNextBatch, settings);
      }
    });
  };

  const handleSaveSettings = async (
    newSettings: AppSettings,
    newClassItems: ClassItem[],
    shouldCloseSettings = false
  ) => {
    console.log("設定保存開始:", {
      newSettings,
      newClassItems,
      shouldCloseSettings,
    });
    console.log("現在の設定:", settings);

    try {
      // フックを使って設定を更新（永続化も自動で行われる）
      updateBoth(newSettings, newClassItems);
      console.log("✅ 設定更新完了");

      // 明示的に保存ボタンが押された場合のみ設定を閉じる
      if (shouldCloseSettings) {
        setShowSettings(false);
      }

      console.log("設定保存後のcurrentFolder:", newSettings.targetFolder);

      // フォルダが変更された場合、画像データをクリア
      if (newSettings.targetFolder !== settings.targetFolder) {
        console.log("📁 フォルダ変更検知 - 画像データをクリア");
        clearBatch();
        setTotalProcessed(0);
        setLastMoveData(null);
      }

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
    } catch (error) {
      console.error("❌ 設定保存エラー:", error);
    }
  };


  const progressPercentage =
    totalImagesCount > 0 ? (totalProcessed / totalImagesCount) * 100 : 0;

  // 設定読み込み中の場合はローディング表示
  if (settingsLoading) {
    return (
      <div className="app-container">
        <div className="loading-screen">
          <h2>⏳ 設定読み込み中...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="main-content">
        {/* メイン画像表示エリア */}
        <div className="image-content-area">
          <ImageGrid
            images={currentBatch}
            imageStates={imageStates}
            classItems={classItems}
            gridCols={settings.gridCols}
            thumbnailHeight={settings.thumbnailHeight ?? 120}
            thumbnailWidth={settings.thumbnailWidth ?? 120}
            onImageClick={handleImageClick}
          />
        </div>

        {/* 最下部固定エリア */}
        <div className="bottom-fixed-area">
          <ProgressBar
            current={totalProcessed}
            total={totalImagesCount}
            percentage={progressPercentage}
          />
          
          <Controls
            onSettingsClick={() => setShowSettings(true)}
            onClassify={handleClassifyClick}
            onUndo={handleUndoClick}
            canClassify={currentBatch.length > 0}
            canUndo={lastMoveData !== null && lastMoveData.length > 0}
            isLoading={isLoading}
            currentFolder={currentFolder}
          />
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          classItems={classItems}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
          isInline={false}
          autoSave={true}
        />
      )}

      {/* Debug Panel - 開発時のみ表示 */}
      {process.argv && process.argv.includes("--dev") && (
        <DebugPanel
          settings={settings}
          classItems={classItems}
          isLoading={settingsLoading}
        />
      )}
    </div>
  );
};

export default App;
