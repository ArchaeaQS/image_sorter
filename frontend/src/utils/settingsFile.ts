/**
 * File-based settings management
 */

import { AppSettings, ClassItem } from '../types';

declare global {
  interface Window {
    require: (module: string) => any;
  }
}

const { ipcRenderer } = window.require('electron');

const DEFAULT_SETTINGS: AppSettings = {
  targetFolder: null,
  classLabels: ['テキスト', '図表', '写真'],
  gridCols: 10,
  gridRows: 10,
};

const DEFAULT_CLASS_COLORS = ['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

/**
 * Load settings from JSON file
 */
export const loadSettingsFromFile = async (): Promise<AppSettings> => {
  try {
    const settings = await ipcRenderer.invoke('load-settings');
    return { ...DEFAULT_SETTINGS, ...settings };
  } catch (error) {
    console.error('設定ファイル読み込みエラー:', error);
    return DEFAULT_SETTINGS;
  }
};

/**
 * Save settings to JSON file
 */
export const saveSettingsToFile = async (settings: AppSettings): Promise<void> => {
  try {
    await ipcRenderer.invoke('save-settings', settings);
    console.log('設定ファイル保存完了:', settings);
  } catch (error) {
    console.error('設定ファイル保存エラー:', error);
  }
};

/**
 * Load class items from JSON file
 */
export const loadClassItemsFromFile = async (): Promise<ClassItem[]> => {
  try {
    const classItems = await ipcRenderer.invoke('load-class-items');
    if (classItems && Array.isArray(classItems)) {
      return classItems;
    }
  } catch (error) {
    console.error('クラス設定ファイル読み込みエラー:', error);
  }

  // デフォルトクラスアイテムを生成
  return DEFAULT_SETTINGS.classLabels.map((label, index) => ({
    id: `class-${index}`,
    name: label,
    color: DEFAULT_CLASS_COLORS[index % DEFAULT_CLASS_COLORS.length],
    order: index,
  }));
};

/**
 * Save class items to JSON file
 */
export const saveClassItemsToFile = async (classItems: ClassItem[]): Promise<void> => {
  try {
    await ipcRenderer.invoke('save-class-items', classItems);
    console.log('クラス設定ファイル保存完了:', classItems);
  } catch (error) {
    console.error('クラス設定ファイル保存エラー:', error);
  }
};

/**
 * Watch for settings file changes
 */
export const watchSettingsFile = (callback: (settings: AppSettings) => void): (() => void) => {
  const handler = (event: any, settings: AppSettings) => {
    console.log('設定ファイル変更検知:', settings);
    callback(settings);
  };

  ipcRenderer.on('settings-changed', handler);
  
  // cleanup function
  return () => {
    ipcRenderer.removeListener('settings-changed', handler);
  };
};

/**
 * Watch for class items file changes
 */
export const watchClassItemsFile = (callback: (classItems: ClassItem[]) => void): (() => void) => {
  const handler = (event: any, classItems: ClassItem[]) => {
    console.log('クラス設定ファイル変更検知:', classItems);
    callback(classItems);
  };

  ipcRenderer.on('class-items-changed', handler);
  
  // cleanup function
  return () => {
    ipcRenderer.removeListener('class-items-changed', handler);
  };
};