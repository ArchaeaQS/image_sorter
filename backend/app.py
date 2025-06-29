"""FastAPI application factory and route handlers."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import (
    ClassifyRequest, ClassifyResponse,
    FolderRequest, ImageInfo,
    UndoRequest, UndoResponse
)
from utils.file_operations import (
    get_images_from_folder,
    move_image_to_label_folder,
    restore_file
)


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
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

    @app.get("/")
    async def root() -> dict[str, str]:
        """Root endpoint returning API information."""
        return {"message": "Image Sorter API", "version": "1.0.0"}

    @app.post("/get-images")
    async def get_images(request: FolderRequest) -> list[ImageInfo]:
        """Get image files from specified folder."""
        try:
            print(f"[DEBUG] Original folder_path: {request.folder_path}")
            return get_images_from_folder(request.folder_path)
        except FileNotFoundError:
            raise HTTPException(status_code=404, detail="指定されたフォルダが存在しません")
        except NotADirectoryError:
            raise HTTPException(status_code=400, detail="指定されたパスはフォルダではありません")
        except PermissionError:
            raise HTTPException(status_code=403, detail="フォルダへのアクセス権限がありません")
        except UnicodeError as e:
            raise HTTPException(status_code=400, detail=f"文字エンコーディングエラー: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"フォルダ読み込み中にエラーが発生しました: {str(e)}")

    @app.post("/classify")
    async def classify_images(request: ClassifyRequest) -> ClassifyResponse:
        """Classify images and move them to label-specific folders."""
        print(f"[DEBUG] Classify request - image_paths: {len(request.image_paths)} items")
        print(f"[DEBUG] Classify request - labels: {request.labels}")
        print(f"[DEBUG] Classify request - target_folder: {request.target_folder}")
        
        if len(request.image_paths) != len(request.labels):
            raise HTTPException(status_code=400, detail="画像パスとラベルの数が一致しません")

        try:
            moved_files = []
            for i, (image_path, label) in enumerate(zip(request.image_paths, request.labels)):
                print(f"[DEBUG] Processing image {i+1}: {image_path} -> {label}")
                
                move_result = move_image_to_label_folder(
                    image_path, label, request.target_folder
                )
                
                if move_result:
                    moved_files.append(move_result)
                    print(f"[DEBUG] Added to moved_files: {move_result['source']} -> {move_result['destination']}")
                else:
                    print(f"[DEBUG] Skipping file: {image_path}")

            return ClassifyResponse(success=True, moved_files=moved_files)

        except FileNotFoundError:
            raise HTTPException(status_code=404, detail="対象フォルダが存在しません")
        except PermissionError:
            raise HTTPException(status_code=403, detail="ファイル操作の権限がありません")
        except UnicodeError as e:
            raise HTTPException(status_code=400, detail=f"文字エンコーディングエラー: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"分類処理中にエラーが発生しました: {str(e)}")

    @app.post("/undo")
    async def undo_classification(request: UndoRequest) -> UndoResponse:
        """Undo previous file moves by restoring files to their original locations."""
        try:
            restored_files = []
            for file_info in request.moved_files:
                restore_result = restore_file(
                    file_info["destination"], 
                    file_info["source"]
                )
                if restore_result:
                    restored_files.append(restore_result)
            
            return UndoResponse(success=True, restored_files=restored_files)
            
        except PermissionError:
            raise HTTPException(status_code=403, detail="ファイル操作の権限がありません")
        except UnicodeError as e:
            raise HTTPException(status_code=400, detail=f"文字エンコーディングエラー: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"取り消し処理中にエラーが発生しました: {str(e)}")

    return app