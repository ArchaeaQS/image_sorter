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
  setImageState: (imagePath: string, state: number) => void;
  loadNextBatch: (images: ImageInfo[], settings: AppSettings) => void;
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

  const setImageState = useCallback((imagePath: string, state: number) => {
    setImageStates(prev => ({
      ...prev,
      [imagePath]: state,
    }));
  }, []);

  const toggleImageState = useCallback((imagePath: string, direction: number, maxState: number) => {
    setImageStates(prev => {
      const currentState = prev[imagePath] || 0;
      let newState: number;
      
      if (direction > 0) {
        newState = (currentState + 1) % (maxState + 1);
      } else {
        newState = currentState - 1;
        if (newState < 0) newState = maxState;
      }
      
      return {
        ...prev,
        [imagePath]: newState,
      };
    });
  }, []);

  const loadNextBatch = useCallback((images: ImageInfo[], settings: AppSettings) => {
    const batchSize = settings.gridCols * settings.gridRows;
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
  }, []);

  const clearBatch = useCallback(() => {
    setCurrentBatch([]);
    setImageStates({});
    setRemainingImages([]);
  }, []);

  return {
    currentBatch,
    imageStates,
    remainingImages,
    setImageState,
    loadNextBatch,
    toggleImageState,
    clearBatch,
  };
};