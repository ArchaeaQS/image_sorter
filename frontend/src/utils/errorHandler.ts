/**
 * 統一されたエラーハンドリングユーティリティ
 */

import { ApiError } from '../services/api';

/**
 * エラーを統一的に処理し、適切なメッセージを表示する
 */
export const handleError = (
  error: unknown,
  context: string,
  defaultMessage: string,
  showAlert = true
): string => {
  console.error(`${context}:`, error);
  
  const message = error instanceof ApiError ? error.message : defaultMessage;
  
  if (showAlert) {
    alert(message);
  }
  
  return message;
};

/**
 * 分類処理用のエラーハンドラー
 */
export const handleClassificationError = (error: unknown): string => {
  return handleError(error, "分類エラー", "分類処理に失敗しました");
};

/**
 * 取り消し処理用のエラーハンドラー
 */
export const handleUndoError = (error: unknown): string => {
  return handleError(error, "取り消しエラー", "取り消し処理に失敗しました");
};

/**
 * 画像読み込み用のエラーハンドラー
 */
export const handleImageLoadError = (error: unknown): string => {
  return handleError(error, "画像読み込みエラー", "画像の読み込みに失敗しました");
};

/**
 * 設定保存用のエラーハンドラー
 */
export const handleSettingsError = (error: unknown, showAlert = false): string => {
  return handleError(error, "設定エラー", "設定の保存に失敗しました", showAlert);
};