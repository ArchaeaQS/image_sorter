"""File operation utilities for image processing."""

import shutil
from pathlib import Path

from models import ImageInfo
from utils.encoding import safe_path_encode, safe_path_decode, normalize_path

SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png"}


def get_images_from_folder(folder_path_str: str) -> list[ImageInfo]:
    """
    指定されたフォルダから画像ファイル一覧を取得する
    
    Args:
        folder_path_str: フォルダパス文字列
        
    Returns:
        ImageInfoのリスト
        
    Raises:
        FileNotFoundError: フォルダが存在しない
        NotADirectoryError: 指定パスがディレクトリではない
    """
    decoded_path = safe_path_decode(folder_path_str)
    normalized_path = normalize_path(decoded_path)
    folder_path = Path(normalized_path)
    
    if not folder_path.exists():
        raise FileNotFoundError("指定されたフォルダが存在しません")
    
    if not folder_path.is_dir():
        raise NotADirectoryError("指定されたパスはフォルダではありません")
    
    images = []
    for file_path in folder_path.iterdir():
        if file_path.is_file() and file_path.suffix.lower() in SUPPORTED_EXTENSIONS:
            safe_path = safe_path_encode(file_path)
            safe_filename = file_path.name
            images.append(ImageInfo(path=safe_path, filename=safe_filename))
    
    return images


def move_image_to_label_folder(
    image_path_str: str, 
    label: str, 
    target_folder_str: str
) -> dict[str, str] | None:
    """
    画像ファイルをラベルフォルダに移動する
    
    Args:
        image_path_str: 画像ファイルパス
        label: ラベル名  
        target_folder_str: 対象フォルダパス
        
    Returns:
        移動情報辞書（sourceとdestination）、失敗時はNone
    """
    decoded_image_path = safe_path_decode(image_path_str)
    source_path = Path(decoded_image_path)
    
    if not source_path.exists():
        return None
    
    if not source_path.suffix.lower() in SUPPORTED_EXTENSIONS:
        return None
    
    decoded_target = safe_path_decode(target_folder_str)
    normalized_target = normalize_path(decoded_target)
    target_folder = Path(normalized_target)
    
    if not target_folder.exists():
        raise FileNotFoundError("対象フォルダが存在しません")
    
    # ラベルフォルダを作成
    label_folder = target_folder / label
    label_folder.mkdir(exist_ok=True)
    
    # ファイル移動先パスを決定（重複回避）
    dest_path = label_folder / source_path.name
    counter = 1
    original_dest_path = dest_path
    while dest_path.exists():
        stem = original_dest_path.stem
        suffix = original_dest_path.suffix
        dest_path = original_dest_path.parent / f"{stem}_{counter}{suffix}"
        counter += 1
    
    # ファイル移動実行
    shutil.move(str(source_path), str(dest_path))
    
    return {
        "source": safe_path_encode(source_path),
        "destination": safe_path_encode(dest_path)
    }


def restore_file(source_path_str: str, dest_path_str: str) -> dict[str, str] | None:
    """
    ファイルを元の場所に戻す
    
    Args:
        source_path_str: 現在の場所
        dest_path_str: 戻す場所
        
    Returns:
        復元情報辞書（fromとto）、失敗時はNone
    """
    decoded_source = safe_path_decode(source_path_str)
    decoded_dest = safe_path_decode(dest_path_str)
    
    source_path = Path(decoded_source)
    dest_path = Path(decoded_dest)
    
    if not source_path.exists():
        return None
    
    if not dest_path.parent.exists():
        return None
    
    shutil.move(str(source_path), str(dest_path))
    
    return {
        "from": safe_path_encode(source_path),
        "to": safe_path_encode(dest_path)
    }