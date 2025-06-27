"""Image Sorter API - FastAPI backend for image classification."""

import shutil
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


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
    folder_path = Path(request.folder_path)

    if not folder_path.exists():
        raise HTTPException(status_code=404, detail="指定されたフォルダが存在しません")

    if not folder_path.is_dir():
        raise HTTPException(
            status_code=400, detail="指定されたパスはフォルダではありません"
        )

    images = []

    try:
        for file_path in folder_path.iterdir():
            if file_path.is_file() and file_path.suffix.lower() in SUPPORTED_EXTENSIONS:
                images.append(ImageInfo(path=str(file_path), filename=file_path.name))
    except PermissionError:
        raise HTTPException(
            status_code=403, detail="フォルダへのアクセス権限がありません"
        )

    # Return first batch of images
    return images[:BATCH_SIZE]


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

    target_folder = Path(request.target_folder)

    if not target_folder.exists():
        raise HTTPException(status_code=404, detail="対象フォルダが存在しません")

    moved_files = []

    try:
        for image_path, label in zip(request.image_paths, request.labels):
            source_path = Path(image_path)

            if not source_path.exists():
                continue

            if not source_path.suffix.lower() in SUPPORTED_EXTENSIONS:
                continue

            # Create label folder
            label_folder = target_folder / label
            label_folder.mkdir(exist_ok=True)

            # Move file
            dest_path = label_folder / source_path.name

            # Handle potential name conflicts
            counter = 1
            original_dest_path = dest_path
            while dest_path.exists():
                stem = original_dest_path.stem
                suffix = original_dest_path.suffix
                dest_path = original_dest_path.parent / f"{stem}_{counter}{suffix}"
                counter += 1

            shutil.move(str(source_path), str(dest_path))
            moved_files.append(
                {"source": str(source_path), "destination": str(dest_path)}
            )

        return ClassifyResponse(success=True, moved_files=moved_files)

    except PermissionError:
        raise HTTPException(status_code=403, detail="ファイル操作の権限がありません")
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
            source_path = Path(file_info["destination"])  # 現在の場所
            dest_path = Path(file_info["source"])  # 元の場所
            
            if not source_path.exists():
                continue
                
            # 元の場所に戻す
            if dest_path.parent.exists():
                shutil.move(str(source_path), str(dest_path))
                restored_files.append({
                    "from": str(source_path),
                    "to": str(dest_path)
                })
        
        return UndoResponse(success=True, restored_files=restored_files)
        
    except PermissionError:
        raise HTTPException(status_code=403, detail="ファイル操作の権限がありません")
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"取り消し処理中にエラーが発生しました: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
