"""Image Sorter API - FastAPI backend for image classification."""

import shutil
import sys
from pathlib import Path
from urllib.parse import unquote

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# UTF-8エンコーディングを強制
if sys.platform.startswith('win'):
    import locale
    try:
        locale.setlocale(locale.LC_ALL, 'ja_JP.UTF-8')
    except locale.Error:
        try:
            locale.setlocale(locale.LC_ALL, 'Japanese_Japan.65001')
        except locale.Error:
            pass


class ClassifyRequest(BaseModel):
    """Request model for image classification."""

    image_paths: list[str]
    labels: list[str]
    target_folder: str


class FolderRequest(BaseModel):
    """Request model for folder path."""

    folder_path: str


class ImageInfo(BaseModel):
    """Image information model."""

    path: str
    filename: str


class ClassifyResponse(BaseModel):
    """Response model for classification result."""

    success: bool
    moved_files: list[dict[str, str]]


class UndoRequest(BaseModel):
    """Request model for undo operation."""

    moved_files: list[dict[str, str]]


class UndoResponse(BaseModel):
    """Response model for undo result."""

    success: bool
    restored_files: list[dict[str, str]]


app = FastAPI(
    title="Image Sorter API",
    description="FastAPI backend for image classification and sorting",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supported image extensions
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png"}
BATCH_SIZE = 100


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint returning API information."""
    return {"message": "Image Sorter API", "version": "1.0.0"}


def safe_path_decode(path_str: str) -> str:
    """
    パス文字列を安全にデコードする
    """
    try:
        # URLエンコードされている場合はデコード
        decoded = unquote(path_str, encoding='utf-8')
        return decoded
    except (UnicodeDecodeError, UnicodeError):
        # デコードに失敗した場合は元の文字列を返す
        return path_str


def safe_path_encode(path_obj: Path) -> str:
    """
    Pathオブジェクトを安全にUTF-8文字列に変換する
    """
    try:
        return str(path_obj)
    except UnicodeEncodeError:
        # エンコードに失敗した場合は置換文字を使用
        return str(path_obj).encode('utf-8', errors='replace').decode('utf-8')


def normalize_path(path_str: str) -> str:
    """
    WindowsパスとWSLパスを正規化する
    """
    # WindowsパスをWSLパスに変換
    if path_str.startswith('C:\\'):
        # C:\... -> /mnt/c/...
        return path_str.replace('C:\\', '/mnt/c/').replace('\\', '/')
    return path_str


@app.post("/get-images")
async def get_images(request: FolderRequest) -> list[ImageInfo]:
    """
    Get image files from specified folder.

    Args:
        request: Folder request containing folder path

    Returns:
        List of image information objects

    Raises:
        HTTPException: If folder doesn't exist
    """
    try:
        # パスを安全にデコードして正規化
        decoded_path = safe_path_decode(request.folder_path)
        normalized_path = normalize_path(decoded_path)
        folder_path = Path(normalized_path)

        if not folder_path.exists():
            raise HTTPException(status_code=404, detail="指定されたフォルダが存在しません")

        if not folder_path.is_dir():
            raise HTTPException(
                status_code=400, detail="指定されたパスはフォルダではありません"
            )

        images = []

        for file_path in folder_path.iterdir():
            if file_path.is_file() and file_path.suffix.lower() in SUPPORTED_EXTENSIONS:
                safe_path = safe_path_encode(file_path)
                safe_filename = file_path.name
                images.append(ImageInfo(path=safe_path, filename=safe_filename))
                
        # Return first batch of images
        return images[:BATCH_SIZE]
        
    except PermissionError:
        raise HTTPException(
            status_code=403, detail="フォルダへのアクセス権限がありません"
        )
    except UnicodeError as e:
        raise HTTPException(
            status_code=400, detail=f"文字エンコーディングエラー: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"フォルダ読み込み中にエラーが発生しました: {str(e)}"
        )


@app.post("/classify")
async def classify_images(request: ClassifyRequest) -> ClassifyResponse:
    """
    Classify images and move them to label-specific folders.

    Args:
        request: Classification request with image paths and labels

    Returns:
        Classification result with moved files information

    Raises:
        HTTPException: If classification fails
    """
    if len(request.image_paths) != len(request.labels):
        raise HTTPException(
            status_code=400, detail="画像パスとラベルの数が一致しません"
        )

    try:
        # 対象フォルダのパスを安全にデコード
        decoded_target = safe_path_decode(request.target_folder)
        target_folder = Path(decoded_target)

        if not target_folder.exists():
            raise HTTPException(status_code=404, detail="対象フォルダが存在しません")

        moved_files = []

        for image_path, label in zip(request.image_paths, request.labels):
            # 画像パスを安全にデコード
            decoded_image_path = safe_path_decode(image_path)
            source_path = Path(decoded_image_path)

            if not source_path.exists():
                continue

            if not source_path.suffix.lower() in SUPPORTED_EXTENSIONS:
                continue

            # ラベルフォルダを作成（UTF-8対応）
            label_folder = target_folder / label
            label_folder.mkdir(exist_ok=True)

            # ファイル移動
            dest_path = label_folder / source_path.name

            # ファイル名の重複を処理
            counter = 1
            original_dest_path = dest_path
            while dest_path.exists():
                stem = original_dest_path.stem
                suffix = original_dest_path.suffix
                dest_path = original_dest_path.parent / f"{stem}_{counter}{suffix}"
                counter += 1

            # ファイル移動を実行（UTF-8パス対応）
            shutil.move(str(source_path), str(dest_path))
            
            # 結果に安全なパス文字列を追加
            moved_files.append({
                "source": safe_path_encode(source_path),
                "destination": safe_path_encode(dest_path)
            })

        return ClassifyResponse(success=True, moved_files=moved_files)

    except PermissionError:
        raise HTTPException(status_code=403, detail="ファイル操作の権限がありません")
    except UnicodeError as e:
        raise HTTPException(
            status_code=400, detail=f"文字エンコーディングエラー: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"分類処理中にエラーが発生しました: {str(e)}"
        )


@app.post("/undo")
async def undo_classification(request: UndoRequest) -> UndoResponse:
    """
    Undo previous file moves by restoring files to their original locations.
    
    Args:
        request: Undo request with list of moved files
        
    Returns:
        Undo result with restored files information
        
    Raises:
        HTTPException: If undo operation fails
    """
    restored_files = []
    
    try:
        for file_info in request.moved_files:
            # パスを安全にデコード
            decoded_destination = safe_path_decode(file_info["destination"])
            decoded_source = safe_path_decode(file_info["source"])
            
            source_path = Path(decoded_destination)  # 現在の場所
            dest_path = Path(decoded_source)  # 元の場所
            
            if not source_path.exists():
                continue
                
            # 元の場所に戻す（UTF-8対応）
            if dest_path.parent.exists():
                shutil.move(str(source_path), str(dest_path))
                restored_files.append({
                    "from": safe_path_encode(source_path),
                    "to": safe_path_encode(dest_path)
                })
        
        return UndoResponse(success=True, restored_files=restored_files)
        
    except PermissionError:
        raise HTTPException(status_code=403, detail="ファイル操作の権限がありません")
    except UnicodeError as e:
        raise HTTPException(
            status_code=400, detail=f"文字エンコーディングエラー: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"取り消し処理中にエラーが発生しました: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
