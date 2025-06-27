/**
 * Type definitions for the Image Sorter React application
 */

export interface ImageInfo {
  path: string;
  filename: string;
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

export interface FolderRequest {
  folder_path: string;
}

export interface AppSettings {
  targetFolder: string | null;
  classLabels: string[];
  gridCols: number;
  gridRows: number;
}

export interface ImageState {
  [imagePath: string]: number; // クラスインデックス (0: 未分類, 1+: 分類済み)
}

export interface AppState {
  currentFolder: string | null;
  images: ImageInfo[];
  currentBatch: ImageInfo[];
  imageStates: ImageState;
  totalProcessed: number;
  lastMoveData: MovedFile[] | null;
  settings: AppSettings;
}

export interface ClassItem {
  id: string;
  name: string;
  color: string;
  order: number;
}