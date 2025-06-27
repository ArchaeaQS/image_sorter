/**
 * API service for image sorter backend communication
 */

const API_BASE_URL = 'http://127.0.0.1:8000';

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
  moved_files: Array<{
    source: string;
    destination: string;
  }>;
}

export interface UndoRequest {
  moved_files: Array<{
    source: string;
    destination: string;
  }>;
}

export interface UndoResponse {
  success: boolean;
  restored_files: Array<{
    from: string;
    to: string;
  }>;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public detail?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Helper function to handle API responses
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorDetail = 'Unknown error';
    try {
      const errorData = await response.json();
      errorDetail = errorData.detail || errorData.message || 'Request failed';
    } catch {
      errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new ApiError(errorDetail, response.status, errorDetail);
  }
  return response.json();
}

/**
 * Get images from specified folder
 */
export async function getImages(folderPath: string): Promise<ImageInfo[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/get-images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folder_path: folderPath,
      }),
    });

    return await handleResponse<ImageInfo[]>(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`画像取得に失敗しました: ${error}`);
  }
}

/**
 * Classify images and move them to label-specific folders
 */
export async function classifyImages(request: ClassifyRequest): Promise<ClassifyResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/classify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    return await handleResponse<ClassifyResponse>(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`分類処理に失敗しました: ${error}`);
  }
}

/**
 * Undo previous file classification
 */
export async function undoClassification(request: UndoRequest): Promise<UndoResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/undo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    return await handleResponse<UndoResponse>(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`取り消し処理に失敗しました: ${error}`);
  }
}

/**
 * Health check for API server
 */
export async function healthCheck(): Promise<{ message: string; version: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    return await handleResponse(response);
  } catch (error) {
    throw new ApiError('APIサーバーに接続できません');
  }
}

export { ApiError };