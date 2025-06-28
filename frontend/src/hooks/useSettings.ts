/**
 * Custom hook for settings management with persistence
 */

import { useState, useCallback } from 'react';
import { AppSettings, ClassItem } from '../types';

const DEFAULT_SETTINGS: AppSettings = {
  targetFolder: null,
  classLabels: ['テキスト', '図表', '写真'],
  gridCols: 10,
  gridRows: 10,
  thumbnailHeight: 160,
  thumbnailWidth: 160,
};

const DEFAULT_CLASS_COLORS = ['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

const STORAGE_KEYS = {
  SETTINGS: 'image-sorter-settings',
  CLASS_ITEMS: 'image-sorter-class-items',
} as const;

/**
 * Load settings from localStorage
 */
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

/**
 * Load class items from localStorage
 */
const loadClassItems = (): ClassItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CLASS_ITEMS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('クラス設定読み込みエラー:', error);
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
 * Save settings to localStorage
 */
const saveSettings = (settings: AppSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('設定保存エラー:', error);
  }
};

/**
 * Save class items to localStorage
 */
const saveClassItems = (classItems: ClassItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CLASS_ITEMS, JSON.stringify(classItems));
  } catch (error) {
    console.error('クラス設定保存エラー:', error);
  }
};

export interface UseSettingsReturn {
  settings: AppSettings;
  classItems: ClassItem[];
  updateSettings: (newSettings: AppSettings) => void;
  updateClassItems: (newClassItems: ClassItem[]) => void;
  updateBoth: (newSettings: AppSettings, newClassItems: ClassItem[]) => void;
}

/**
 * Custom hook for managing settings and class items with persistence
 */
export const useSettings = (): UseSettingsReturn => {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [classItems, setClassItems] = useState<ClassItem[]>(loadClassItems);

  const updateSettings = useCallback((newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  }, []);

  const updateClassItems = useCallback((newClassItems: ClassItem[]) => {
    setClassItems(newClassItems);
    saveClassItems(newClassItems);
    
    // classItemsの変更時にsettingsのclassLabelsも同期
    const classLabels = newClassItems.map(item => item.name);
    const updatedSettings = { ...settings, classLabels };
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
  }, [settings]);

  const updateBoth = useCallback((newSettings: AppSettings, newClassItems: ClassItem[]) => {
    setSettings(newSettings);
    setClassItems(newClassItems);
    saveSettings(newSettings);
    saveClassItems(newClassItems);
  }, []);

  return {
    settings,
    classItems,
    updateSettings,
    updateClassItems,
    updateBoth,
  };
};

export { DEFAULT_SETTINGS, DEFAULT_CLASS_COLORS };