@echo off
setlocal enabledelayedexpansion

REM Image Sorter - 配布用ビルドスクリプト (Windows)
REM 使用方法: build-distribution.bat

echo 🚀 Image Sorter 配布用ビルド開始...
echo ========================================

REM ログファイル
for /f "tokens=1,2,3,4 delims=/ " %%a in ('date /t') do set "datestamp=%%c%%a%%b"
for /f "tokens=1,2 delims=: " %%a in ('time /t') do set "timestamp=%%a%%b"
set "LOG_FILE=build-%datestamp%_%timestamp%.log"

REM 1. 環境チェック
echo [%time%] 🔍 環境チェック中... >> %LOG_FILE%
echo 🔍 環境チェック中...

where node >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js がインストールされていません
    goto :error
)

where npm >nul 2>&1
if errorlevel 1 (
    echo ❌ npm がインストールされていません
    goto :error
)

where uv >nul 2>&1
if errorlevel 1 (
    echo ❌ uv がインストールされていません
    goto :error
)

echo ✅ 環境チェック完了

REM 2. バックエンドのスタンドアロンビルド
echo 🐍 バックエンドのスタンドアロン実行ファイル作成中...
cd backend

REM PyInstallerをインストール
echo 📦 PyInstallerをインストール中...
uv add pyinstaller

REM スタンドアロン実行ファイル作成
echo 🔨 PyInstallerでビルド中...
uv run pyinstaller --onefile --noconsole --optimize 2 --name image-sorter-backend main.py

if not exist "dist\image-sorter-backend.exe" (
    echo ❌ バックエンドの実行ファイル作成に失敗しました
    goto :error
)

echo ✅ バックエンド完了
cd ..

REM 3. フロントエンドにバックエンドをコピー
echo 📁 バックエンドをフロントエンドにコピー中...
cd frontend

REM backend-distディレクトリを準備
if exist backend-dist rmdir /s /q backend-dist
mkdir backend-dist

REM 実行ファイルをコピー
copy ..\backend\dist\image-sorter-backend.exe backend-dist\

echo ✅ コピー完了

REM 4. フロントエンドの依存関係インストール
echo 📦 フロントエンドの依存関係インストール中...
npm install

REM 5. フロントエンドビルド
echo ⚡ フロントエンドビルド中...
npm run build:all

REM 6. Electronアプリのパッケージング
echo 📦 Electronアプリのパッケージング中...
npm run dist:win

REM 7. 結果の確認
echo 📊 ビルド結果の確認中...

if exist release (
    echo ✅ 配布ファイルが作成されました:
    dir release\
) else (
    echo ❌ 配布ファイルの作成に失敗しました
    goto :error
)

cd ..

REM 8. 完了メッセージ
echo.
echo 🎉 配布用ビルド完了!
echo ========================================
echo 📁 配布ファイル: frontend\release\
echo 📝 ビルドログ: %LOG_FILE%
echo.
echo 📋 配布ファイルの使用方法:
echo   Windows: Image Sorter Setup 1.0.0.exe
echo.
echo ⚠️  注意: 配布先ではPythonは不要です（スタンドアロン版）
echo.
goto :end

:error
echo ❌ エラーが発生しました
echo 📝 詳細なログ: %LOG_FILE%
exit /b 1

:end
pause