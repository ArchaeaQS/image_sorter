#!/bin/bash

# Image Sorter - 配布用ビルドスクリプト
# 使用方法: ./build-distribution.sh

set -e  # エラー時に停止

echo "🚀 Image Sorter 配布用ビルド開始..."
echo "========================================"

# ログファイル
LOG_FILE="build-$(date +%Y%m%d_%H%M%S).log"

# 関数: ログ出力
log() {
    echo "[$(date '+%H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 関数: エラーハンドリング
handle_error() {
    log "❌ エラーが発生しました: $1"
    log "📝 詳細なログ: $LOG_FILE"
    exit 1
}

# 1. 環境チェック
log "🔍 環境チェック中..."

if ! command -v node &> /dev/null; then
    handle_error "Node.js がインストールされていません"
fi

if ! command -v npm &> /dev/null; then
    handle_error "npm がインストールされていません"
fi

if ! command -v uv &> /dev/null; then
    handle_error "uv がインストールされていません"
fi

log "✅ 環境チェック完了"

# 2. バックエンドのスタンドアロンビルド
log "🐍 バックエンドのスタンドアロン実行ファイル作成中..."

cd backend

# PyInstallerをインストール
if ! uv list | grep -q pyinstaller; then
    log "📦 PyInstallerをインストール中..."
    uv add pyinstaller
fi

# スタンドアロン実行ファイル作成
log "🔨 PyInstallerでビルド中..."
uv run pyinstaller \
    --onefile \
    --noconsole \
    --optimize 2 \
    --name image-sorter-backend \
    --distpath dist \
    main.py

if [ ! -f "dist/image-sorter-backend" ]; then
    handle_error "バックエンドの実行ファイル作成に失敗しました"
fi

BACKEND_SIZE=$(du -h dist/image-sorter-backend | cut -f1)
log "✅ バックエンド完了 (サイズ: $BACKEND_SIZE)"

cd ..

# 3. フロントエンドにバックエンドをコピー
log "📁 バックエンドをフロントエンドにコピー中..."

cd frontend

# backend-distディレクトリを準備
rm -rf backend-dist
mkdir -p backend-dist

# 実行ファイルをコピー
cp ../backend/dist/image-sorter-backend backend-dist/

log "✅ コピー完了"

# 4. フロントエンドの依存関係インストール
log "📦 フロントエンドの依存関係インストール中..."
npm install

# 5. フロントエンドビルド
log "⚡ フロントエンドビルド中..."
npm run build:all

# 6. Electronアプリのパッケージング
log "📦 Electronアプリのパッケージング中..."

# プラットフォーム検出
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    PLATFORM="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    PLATFORM="mac"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    PLATFORM="win"
else
    PLATFORM="linux"  # デフォルト
fi

# electron-builderでパッケージング
case $PLATFORM in
    "linux")
        npm run dist:linux
        ;;
    "mac")
        npm run dist:mac
        ;;
    "win")
        npm run dist:win
        ;;
esac

# 7. 結果の確認
log "📊 ビルド結果の確認中..."

if [ -d "release" ]; then
    log "✅ 配布ファイルが作成されました:"
    ls -lh release/ | tee -a "../$LOG_FILE"
    
    TOTAL_SIZE=$(du -sh release/ | cut -f1)
    log "📦 合計サイズ: $TOTAL_SIZE"
else
    handle_error "配布ファイルの作成に失敗しました"
fi

cd ..

# 8. 完了メッセージ
echo ""
echo "🎉 配布用ビルド完了!"
echo "========================================"
echo "📁 配布ファイル: frontend/release/"
echo "📝 ビルドログ: $LOG_FILE"
echo ""
echo "📋 配布ファイルの使用方法:"
echo "  Linux  : Image Sorter-1.0.0.AppImage (chmod +x 必要)"
echo "  Windows: Image Sorter Setup 1.0.0.exe"
echo "  macOS  : Image Sorter-1.0.0.dmg"
echo ""
echo "⚠️  注意: 配布先ではPythonは不要です（スタンドアロン版）"
echo ""