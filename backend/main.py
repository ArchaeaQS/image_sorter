"""Image Sorter API - FastAPI backend for image classification."""

from app import create_app
from utils.encoding import setup_locale

setup_locale()
app = create_app()






if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
