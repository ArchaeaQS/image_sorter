/**
 * Custom hook for file-based settings management
 */

import { useState, useCallback, useEffect } from 'react';
import { AppSettings, ClassItem, UseSettingsReturn } from '../types';
import { DEFAULT_SETTINGS, DEFAULT_COLORS } from '../constants';
import {
  loadSettingsFromFile,
  saveSettingsToFile,
  loadClassItemsFromFile,
  saveClassItemsToFile,
  watchSettingsFile,
  watchClassItemsFile,
} from '../utils/settingsFile';

/**
 * Custom hook for managing settings and class items with file persistence
 */
export const useSettingsFile = (): UseSettingsReturn => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [classItems, setClassItems] = useState<ClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 初期設定の読み込み
  useEffect(() => {
    const loadInitialSettings = async () => {
      console.log('🔄 設定ファイル読み込み開始');
      
      // まずlocalStorageから読み込んでフォールバック
      console.log('📦 localStorage から読み込み中...');
      try {
        const localSettings = localStorage.getItem('image-sorter-settings');
        const localClassItems = localStorage.getItem('image-sorter-class-items');
        
        if (localSettings) {
          const parsedSettings = JSON.parse(localSettings);
          console.log('📦 localStorage設定発見:', parsedSettings);
          setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
        }
        
        if (localClassItems) {
          const parsedClassItems = JSON.parse(localClassItems);
          console.log('📦 localStorageクラス設定発見:', parsedClassItems);
          setClassItems(parsedClassItems);
        } else {
          // デフォルトクラスアイテム設定
          const defaultClassItems = DEFAULT_SETTINGS.classLabels.map((label, index) => ({
            id: `class-${index}`,
            name: label,
            color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
            order: index,
          }));
          setClassItems(defaultClassItems);
        }
      } catch (error) {
        console.error('📦 localStorage読み込みエラー:', error);
      }
      
      // ファイルベースの読み込みも試す
      try {
        console.log('📁 設定ファイル読み込み中...');
        const loadedSettings = await loadSettingsFromFile();
        console.log('📁 設定ファイル読み込み結果:', loadedSettings);
        if (loadedSettings && loadedSettings.targetFolder) {
          setSettings(loadedSettings);
        }

        console.log('🏷️ クラス設定ファイル読み込み中...');
        const loadedClassItems = await loadClassItemsFromFile();
        console.log('🏷️ クラス設定ファイル読み込み結果:', loadedClassItems);
        if (loadedClassItems && loadedClassItems.length > 0) {
          setClassItems(loadedClassItems);
        }

        console.log('✅ 設定ファイル読み込み完了');
      } catch (error) {
        console.error('❌ 設定ファイル読み込みエラー (フォールバック完了):', error);
      } finally {
        setIsLoading(false);
        console.log('🏁 設定読み込み処理終了');
      }
    };

    loadInitialSettings();
  }, []);

  // ファイル変更の監視
  useEffect(() => {
    const cleanupSettings = watchSettingsFile((newSettings) => {
      console.log('設定ファイル変更を受信:', newSettings);
      setSettings(newSettings);
    });

    const cleanupClassItems = watchClassItemsFile((newClassItems) => {
      console.log('クラス設定ファイル変更を受信:', newClassItems);
      setClassItems(newClassItems);
    });

    return () => {
      cleanupSettings();
      cleanupClassItems();
    };
  }, []);

  const updateSettings = useCallback(async (newSettings: AppSettings) => {
    console.log('💾 設定更新開始:', newSettings);
    setSettings(newSettings);
    
    // localStorageにも保存
    try {
      localStorage.setItem('image-sorter-settings', JSON.stringify(newSettings));
      console.log('📦 localStorage保存完了');
    } catch (error) {
      console.error('📦 localStorage保存エラー:', error);
    }
    
    // ファイルにも保存
    try {
      await saveSettingsToFile(newSettings);
      console.log('✅ 設定ファイル保存完了');
    } catch (error) {
      console.error('❌ 設定ファイル保存エラー:', error);
    }
  }, []);

  const updateClassItems = useCallback(async (newClassItems: ClassItem[]) => {
    console.log('クラス設定更新:', newClassItems);
    setClassItems(newClassItems);
    await saveClassItemsToFile(newClassItems);
    
    // classItemsの変更時にsettingsのclassLabelsも同期
    const classLabels = newClassItems.map(item => item.name);
    const updatedSettings = { ...settings, classLabels };
    setSettings(updatedSettings);
    await saveSettingsToFile(updatedSettings);
  }, [settings]);

  const updateBoth = useCallback(async (newSettings: AppSettings, newClassItems: ClassItem[]) => {
    console.log('💾 設定・クラス一括更新:', { newSettings, newClassItems });
    setSettings(newSettings);
    setClassItems(newClassItems);
    
    // localStorageにも保存
    try {
      localStorage.setItem('image-sorter-settings', JSON.stringify(newSettings));
      localStorage.setItem('image-sorter-class-items', JSON.stringify(newClassItems));
      console.log('📦 localStorage一括保存完了');
    } catch (error) {
      console.error('📦 localStorage一括保存エラー:', error);
    }
    
    // ファイルにも保存
    try {
      await saveSettingsToFile(newSettings);
      await saveClassItemsToFile(newClassItems);
      console.log('✅ ファイル一括保存完了');
    } catch (error) {
      console.error('❌ ファイル一括保存エラー:', error);
    }
  }, []);

  return {
    settings,
    classItems,
    updateSettings,
    updateClassItems,
    updateBoth,
    isLoading,
  };
};