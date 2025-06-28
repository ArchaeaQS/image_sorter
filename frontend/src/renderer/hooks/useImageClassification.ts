/**
 * Custom hook for image classification logic
 */

import { useState } from 'react';
import { ImageInfo, ClassItem, MovedFile } from '../../types';
import { classifyImages, undoClassification, ApiError } from '../../services/api';

export const useImageClassification = () => {
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [lastMoveData, setLastMoveData] = useState<MovedFile[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleClassify = async (
    currentBatch: ImageInfo[],
    imageStates: Record<string, number>,
    classItems: ClassItem[],
    currentFolder: string | null,
    remainingImages: ImageInfo[],
    loadNextBatch: (images: ImageInfo[], settings: any) => void,
    settings: any
  ) => {
    const imagesToClassify = currentBatch.filter(
      (image) => imageStates[image.path] !== undefined
    );

    if (imagesToClassify.length === 0) {
      alert("分類する画像を選択してください");
      return;
    }

    if (!currentFolder) {
      alert("対象フォルダが設定されていません");
      return;
    }

    setIsLoading(true);
    try {
      const imagePaths = imagesToClassify.map((image) => image.path);
      const labels = imagesToClassify.map(
        (image) =>
          classItems[imageStates[image.path]]?.name || classItems[0]?.name || ""
      );

      const result = await classifyImages({
        image_paths: imagePaths,
        labels: labels,
        target_folder: currentFolder,
      });

      if (result.success) {
        setLastMoveData(result.moved_files);
        setTotalProcessed((prev) => prev + imagesToClassify.length);

        // 次のバッチを表示
        loadNextBatch(remainingImages, settings);
      }
    } catch (error) {
      console.error("分類エラー:", error);
      const message =
        error instanceof ApiError ? error.message : "分類処理に失敗しました";
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUndo = async () => {
    if (!lastMoveData || lastMoveData.length === 0) {
      alert("取り消すファイル移動がありません");
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
        setTotalProcessed((prev) =>
          Math.max(0, prev - (lastMoveData?.length || 0))
        );

        alert(`${result.restored_files.length}件のファイルを元に戻しました`);
      }
    } catch (error) {
      console.error("取り消しエラー:", error);
      const message =
        error instanceof ApiError
          ? error.message
          : "取り消し処理に失敗しました";
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    totalProcessed,
    setTotalProcessed,
    lastMoveData,
    setLastMoveData,
    isLoading,
    handleClassify,
    handleUndo,
  };
};