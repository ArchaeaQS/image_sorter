"""Tests for the refactored Image Sorter API."""

import json
import tempfile
from pathlib import Path
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app import create_app
from models import FolderRequest, ClassifyRequest, UndoRequest
from utils.file_operations import SUPPORTED_EXTENSIONS


@pytest.fixture
def client():
    """Create test client."""
    app = create_app()
    return TestClient(app)


@pytest.fixture
def temp_image_folder():
    """Create temporary folder with test images."""
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        
        # Create test image files
        for i in range(3):
            (temp_path / f"test_{i}.jpg").touch()
        
        # Create non-image file
        (temp_path / "test.txt").touch()
        
        yield temp_path


@pytest.fixture
def temp_target_folder():
    """Create temporary target folder."""
    with tempfile.TemporaryDirectory() as temp_dir:
        yield Path(temp_dir)


class TestRootEndpoint:
    """Test root endpoint."""
    
    def test_root_returns_api_info(self, client):
        """Test that root endpoint returns API information."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Image Sorter API"
        assert data["version"] == "1.0.0"


class TestGetImages:
    """Test get images endpoint."""
    
    def test_get_images_success(self, client, temp_image_folder):
        """Test successful image retrieval."""
        request = FolderRequest(folder_path=str(temp_image_folder))
        response = client.post("/get-images", json=request.model_dump())
        
        assert response.status_code == 200
        images = response.json()
        assert len(images) == 3  # Only .jpg files
        
        for image in images:
            assert "path" in image
            assert "filename" in image
            assert image["filename"].endswith(".jpg")
    
    def test_get_images_nonexistent_folder(self, client):
        """Test error when folder doesn't exist."""
        request = FolderRequest(folder_path="/nonexistent/folder")
        response = client.post("/get-images", json=request.model_dump())
        
        assert response.status_code == 404
        assert "指定されたフォルダが存在しません" in response.json()["detail"]
    
    def test_get_images_file_instead_of_folder(self, client, temp_image_folder):
        """Test error when path is file instead of folder."""
        test_file = temp_image_folder / "test_file.jpg"
        test_file.touch()
        
        request = FolderRequest(folder_path=str(test_file))
        response = client.post("/get-images", json=request.model_dump())
        
        assert response.status_code == 400
        assert "指定されたパスはフォルダではありません" in response.json()["detail"]


class TestClassifyImages:
    """Test classify images endpoint."""
    
    def test_classify_success(self, client, temp_image_folder, temp_target_folder):
        """Test successful image classification."""
        # Create test images
        image_paths = []
        for i in range(2):
            img_path = temp_image_folder / f"test_{i}.jpg"
            img_path.touch()
            image_paths.append(str(img_path))
        
        request = ClassifyRequest(
            image_paths=image_paths,
            labels=["class1", "class2"],
            target_folder=str(temp_target_folder)
        )
        
        response = client.post("/classify", json=request.model_dump())
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["moved_files"]) == 2
        
        # Check that label folders were created
        assert (temp_target_folder / "class1").exists()
        assert (temp_target_folder / "class2").exists()
    
    def test_classify_mismatched_lengths(self, client):
        """Test error when image paths and labels have different lengths."""
        request = ClassifyRequest(
            image_paths=["path1.jpg", "path2.jpg"],
            labels=["class1"],
            target_folder="/some/folder"
        )
        
        response = client.post("/classify", json=request.model_dump())
        
        assert response.status_code == 400
        assert "画像パスとラベルの数が一致しません" in response.json()["detail"]
    
    def test_classify_nonexistent_target_folder(self, client, temp_image_folder):
        """Test error when target folder doesn't exist."""
        img_path = temp_image_folder / "test.jpg"
        img_path.touch()
        
        request = ClassifyRequest(
            image_paths=[str(img_path)],
            labels=["class1"],
            target_folder="/nonexistent/folder"
        )
        
        response = client.post("/classify", json=request.model_dump())
        
        assert response.status_code == 404
        assert "対象フォルダが存在しません" in response.json()["detail"]


class TestUndoClassification:
    """Test undo classification endpoint."""
    
    def test_undo_success(self, client, temp_image_folder, temp_target_folder):
        """Test successful undo operation."""
        # Setup: move a file first
        original_file = temp_image_folder / "test.jpg"
        original_file.touch()
        
        class_folder = temp_target_folder / "class1"
        class_folder.mkdir()
        moved_file = class_folder / "test.jpg"
        
        # Simulate file move
        original_file.rename(moved_file)
        
        # Test undo
        moved_files = [{
            "source": str(original_file),
            "destination": str(moved_file)
        }]
        
        request = UndoRequest(moved_files=moved_files)
        response = client.post("/undo", json=request.model_dump())
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["restored_files"]) == 1
        
        # Check that file was restored
        assert original_file.exists()
        assert not moved_file.exists()
    
    def test_undo_nonexistent_file(self, client):
        """Test undo with nonexistent file."""
        moved_files = [{
            "source": "/original/path.jpg",
            "destination": "/nonexistent/path.jpg"
        }]
        
        request = UndoRequest(moved_files=moved_files)
        response = client.post("/undo", json=request.model_dump())
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["restored_files"]) == 0  # No files were restored


class TestFileOperations:
    """Test file operation utilities."""
    
    def test_supported_extensions(self):
        """Test that supported extensions are correctly defined."""
        expected = {".jpg", ".jpeg", ".png"}
        assert SUPPORTED_EXTENSIONS == expected


# Integration tests
class TestAPIIntegration:
    """Integration tests for the full API workflow."""
    
    def test_full_workflow(self, client, temp_target_folder):
        """Test complete workflow: get images -> classify -> undo."""
        # Create fresh temporary folder to avoid fixture interference
        import tempfile
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_image_folder = Path(temp_dir)
            
            # Create test images
            for i in range(3):
                (temp_image_folder / f"image_{i}.jpg").touch()
            
            # Step 1: Get images
            get_request = FolderRequest(folder_path=str(temp_image_folder))
            get_response = client.post("/get-images", json=get_request.model_dump())
            assert get_response.status_code == 200
            images = get_response.json()
            assert len(images) == 3
        
            # Step 2: Classify images
            image_paths = [img["path"] for img in images]
            labels = ["class_a", "class_b", "class_c"]
            
            classify_request = ClassifyRequest(
                image_paths=image_paths,
                labels=labels,
                target_folder=str(temp_target_folder)
            )
            classify_response = client.post("/classify", json=classify_request.model_dump())
            assert classify_response.status_code == 200
            
            classify_data = classify_response.json()
            assert classify_data["success"] is True
            moved_files = classify_data["moved_files"]
            assert len(moved_files) == 3
            
            # Step 3: Undo classification
            undo_request = UndoRequest(moved_files=moved_files)
            undo_response = client.post("/undo", json=undo_request.model_dump())
            assert undo_response.status_code == 200
            
            undo_data = undo_response.json()
            assert undo_data["success"] is True
            assert len(undo_data["restored_files"]) == 3
            
            # Verify files are back in original location
            for img in images:
                assert Path(img["path"]).exists()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])