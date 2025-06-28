/**
 * Type definitions for the main process
 */

// Image related types
export interface ImageInfo {
  path: string;
  filename: string;
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
  moved_files: Array<{ source: string; destination: string }>;
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
  thumbnailHeight?: number;
  thumbnailWidth?: number;
}

// API request types
export interface FolderRequest {
  folder_path: string;
}