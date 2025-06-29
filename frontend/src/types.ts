/**
 * Type definitions for the Image Sorter React application
 */

// Image related types
export interface ImageInfo {
  path: string;
  filename: string;
}

export interface ImageState {
  [imagePath: string]: number; // クラスインデックス (0: 最初のクラス, 1: 2番目のクラス, ...)
}

// Classification related types
export interface ClassItem {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface ClassifyRequest {
  image_paths: string[];
  labels: string[];
  target_folder: string;
}

export interface ClassifyResponse {
  success: boolean;
  moved_files: MovedFile[];
}

export interface MovedFile {
  source: string;
  destination: string;
}

// Settings and configuration types
export interface AppSettings {
  targetFolder: string | null;
  classLabels: string[];
  gridCols: number;
  gridRows: number;
  thumbnailHeight?: number; // サムネイル高さ(px)
  thumbnailWidth?: number; // サムネイル幅(px)
}

// Hook return types
export interface UseSettingsReturn {
  settings: AppSettings;
  classItems: ClassItem[];
  updateSettings: (newSettings: AppSettings) => void;
  updateClassItems: (newClassItems: ClassItem[]) => void;
  updateBoth: (newSettings: AppSettings, newClassItems: ClassItem[]) => void;
  isLoading?: boolean; // オプショナル - useSettingsFileでのみ使用
}

// API request types
export interface FolderRequest {
  folder_path: string;
}

// Application state types
export interface AppState {
  currentFolder: string | null;
  images: ImageInfo[];
  currentBatch: ImageInfo[];
  imageStates: ImageState;
  totalProcessed: number;
  lastMoveData: MovedFile[] | null;
  settings: AppSettings;
}