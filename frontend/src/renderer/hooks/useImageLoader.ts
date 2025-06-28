/**
 * Custom hook for image loading logic
 */

import { useState, useEffect } from 'react';
import { getImages, checkFolderExists, ApiError } from '../../services/api';

export const useImageLoader = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasAutoLoaded, setHasAutoLoaded] = useState(false);

  const handleLoadImages = async (
    currentFolder: string | null,
    loadNextBatch: (images: any[], settings: any) => void,
    settings: any
  ) => {
    console.log("画像読み込み開始 - currentFolder:", currentFolder);
    console.log("現在のsettings:", settings);

    if (!currentFolder) {
      alert("フォルダを選択してください");
      return;
    }

    setIsLoading(true);
    try {
      // フォルダの存在チェック
      const folderExists = await checkFolderExists(currentFolder);
      if (!folderExists) {
        alert(
          `指定されたフォルダが存在しません:\n${currentFolder}\n\n設定タブでフォルダを再選択してください。`
        );
        return;
      }

      const images = await getImages(currentFolder);
      loadNextBatch(images, settings);
    } catch (error) {
      console.error("画像読み込みエラー:", error);
      const message =
        error instanceof ApiError
          ? error.message
          : "画像の読み込みに失敗しました";
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  // フォルダ変更時にhasAutoLoadedをリセット
  const useAutoImageLoader = (
    currentFolder: string | null,
    currentBatch: any[],
    remainingImages: any[],
    settingsLoading: boolean,
    loadNextBatch: (images: any[], settings: any) => void,
    settings: any
  ) => {
    useEffect(() => {
      setHasAutoLoaded(false);
    }, [currentFolder]);

    // 自動画像読み込み
    useEffect(() => {
      const shouldAutoLoad =
        currentFolder &&
        currentBatch.length === 0 &&
        remainingImages.length === 0 &&
        !hasAutoLoaded &&
        !settingsLoading &&
        !isLoading;

      if (shouldAutoLoad) {
        console.log("🔄 自動画像読み込み開始");
        setHasAutoLoaded(true);
        handleLoadImages(currentFolder, loadNextBatch, settings);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      currentFolder,
      currentBatch.length,
      remainingImages.length,
      hasAutoLoaded,
      settingsLoading,
      isLoading,
    ]);
  };

  return {
    isLoading,
    hasAutoLoaded,
    setHasAutoLoaded,
    handleLoadImages,
    useAutoImageLoader,
  };
};