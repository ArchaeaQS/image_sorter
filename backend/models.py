"""Request and response models for the Image Sorter API."""

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