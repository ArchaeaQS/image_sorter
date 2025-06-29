"""UTF-8 encoding utilities for cross-platform compatibility."""

import sys
from pathlib import Path
from urllib.parse import unquote


def setup_locale() -> None:
    """Setup UTF-8 locale for Windows environment."""
    if sys.platform.startswith('win'):
        import locale
        try:
            locale.setlocale(locale.LC_ALL, 'ja_JP.UTF-8')
        except locale.Error:
            try:
                locale.setlocale(locale.LC_ALL, 'Japanese_Japan.65001')
            except locale.Error:
                pass


def safe_path_decode(path_str: str) -> str:
    """
    パス文字列を安全にデコードする
    """
    try:
        decoded = unquote(path_str, encoding='utf-8')
        return decoded
    except (UnicodeDecodeError, UnicodeError):
        return path_str


def safe_path_encode(path_obj: Path) -> str:
    """
    Pathオブジェクトを安全にUTF-8文字列に変換する
    """
    try:
        return str(path_obj)
    except UnicodeEncodeError:
        return str(path_obj).encode('utf-8', errors='replace').decode('utf-8')


def normalize_path(path_str: str) -> str:
    """
    WindowsパスとWSLパスを正規化する
    """
    if path_str.startswith('C:\\\\') or path_str.startswith('C:\\'):
        normalized = path_str.replace('C:\\\\', '/mnt/c/').replace('C:\\', '/mnt/c/')
        normalized = normalized.replace('\\\\', '/').replace('\\', '/')
        return normalized
    return path_str