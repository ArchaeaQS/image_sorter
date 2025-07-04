/**
 * Custom hook for image batch management
 */

import { useState, useCallback } from 'react';
import { ImageInfo, AppSettings } from '../types';

export interface ImageStates {
  [imagePath: string]: number;
}

export interface UseImageBatchReturn {
  currentBatch: ImageInfo[];
  imageStates: ImageStates;
  remainingImages: ImageInfo[];
  totalImagesCount: number;
  setImageState: (imagePath: string, state: number) => void;
  loadNextBatch: (images: ImageInfo[], settings: AppSettings, isInitialLoad?: boolean) => void;
  toggleImageState: (imagePath: string, direction: number, maxState: number) => void;
  clearBatch: () => void;
}

/**
 * Custom hook for managing image batches and their classification states
 */
export const useImageBatch = (): UseImageBatchReturn => {
  const [currentBatch, setCurrentBatch] = useState<ImageInfo[]>([]);
  const [imageStates, setImageStates] = useState<ImageStates>({});
  const [remainingImages, setRemainingImages] = useState<ImageInfo[]>([]);
  const [totalImagesCount, setTotalImagesCount] = useState<number>(0);

  const setImageState = useCallback((imagePath: string, state: number) => {
    setImageStates(prev => ({
      ...prev,
      [imagePath]: state,
    }));
  }, []);

  const toggleImageState = useCallback((imagePath: string, direction: number, maxState: number) => {
    setImageStates(prev => {
      const currentState = prev[imagePath] || 0; // デフォルトを0に戻す
      let newState: number;
      
      if (direction > 0) {
        newState = (currentState + 1) % maxState; // 0からmaxState-1まで循環
      } else {
        newState = currentState - 1;
        if (newState < 0) newState = maxState - 1; // 0未満になったら最大値-1に
      }
      
      return {
        ...prev,
        [imagePath]: newState,
      };
    });
  }, []);

  const loadNextBatch = useCallback((images: ImageInfo[], settings: AppSettings, isInitialLoad = false) => {
    const batchSize = settings.gridCols * settings.gridRows;
    
    // 全画像数は最初の読み込み時のみ設定
    if (isInitialLoad || totalImagesCount === 0) {
      setTotalImagesCount(images.length);
    }
    
    const nextBatch = images.slice(0, batchSize);
    const remaining = images.slice(batchSize);

    // 新しいバッチの画像状態を初期化
    const newImageStates: ImageStates = {};
    nextBatch.forEach(image => {
      newImageStates[image.path] = 0; // 未分類状態
    });

    setCurrentBatch(nextBatch);
    setRemainingImages(remaining);
    setImageStates(newImageStates);
  }, [totalImagesCount]);

  const clearBatch = useCallback(() => {
    setCurrentBatch([]);
    setImageStates({});
    setRemainingImages([]);
    setTotalImagesCount(0);
  }, []);

  return {
    currentBatch,
    imageStates,
    remainingImages,
    totalImagesCount,
    setImageState,
    loadNextBatch,
    toggleImageState,
    clearBatch,
  };
};