# Image Sorter

画像分類モデル用データセット作成ツール

## 構成

- `backend/`: FastAPI バックエンド
- `frontend/`: Electron フロントエンド
- `requirements.md`: 要件定義
- `CLAUDE.md`: Claude向け開発ガイド

## セットアップ

### バックエンド
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### フロントエンド
```bash
cd frontend
npm install
npm start
```