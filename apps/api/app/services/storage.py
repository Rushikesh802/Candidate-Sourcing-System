import os
from abc import ABC, abstractmethod
from typing import BinaryIO
from app.core.config import settings


class StorageAdapter(ABC):
    """Abstract storage adapter interface for file handling."""

    @abstractmethod
    def put(self, key: str, data: bytes, content_type: str = "application/octet-stream") -> str:
        """Store file data at key and return the stored key."""
        pass

    @abstractmethod
    def get(self, key: str) -> BinaryIO:
        """Retrieve binary stream for the given key."""
        pass

    @abstractmethod
    def delete(self, key: str) -> bool:
        """Delete file associated with key."""
        pass

    @abstractmethod
    def exists(self, key: str) -> bool:
        """Check if file exists."""
        pass


class LocalStorage(StorageAdapter):
    """Local disk file storage implementation."""

    def __init__(self, base_dir: str = None):
        self.base_dir = os.path.abspath(base_dir or settings.UPLOAD_DIR)
        os.makedirs(self.base_dir, exist_ok=True)
        # Create subdirectories for resumes and photos
        os.makedirs(os.path.join(self.base_dir, "resumes"), exist_ok=True)
        os.makedirs(os.path.join(self.base_dir, "photos"), exist_ok=True)

    def _get_path(self, key: str) -> str:
        # Prevent directory traversal attacks
        clean_key = os.path.normpath(key).lstrip(r"\/")
        return os.path.join(self.base_dir, clean_key)

    def put(self, key: str, data: bytes, content_type: str = "application/octet-stream") -> str:
        full_path = self._get_path(key)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "wb") as f:
            f.write(data)
        return key

    def get(self, key: str) -> BinaryIO:
        full_path = self._get_path(key)
        if not os.path.exists(full_path) or not os.path.isfile(full_path):
            raise FileNotFoundError(f"File not found for key: {key}")
        return open(full_path, "rb")

    def delete(self, key: str) -> bool:
        full_path = self._get_path(key)
        if os.path.exists(full_path) and os.path.isfile(full_path):
            os.remove(full_path)
            return True
        return False

    def exists(self, key: str) -> bool:
        full_path = self._get_path(key)
        return os.path.exists(full_path) and os.path.isfile(full_path)


_storage_instance: StorageAdapter = None


def get_storage() -> StorageAdapter:
    """Singleton getter for storage adapter."""
    global _storage_instance
    if _storage_instance is None:
        _storage_instance = LocalStorage()
    return _storage_instance
