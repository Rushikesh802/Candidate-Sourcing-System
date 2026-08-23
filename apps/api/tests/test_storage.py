import os
import shutil
import tempfile
import pytest
from app.services.storage import LocalStorage


@pytest.fixture
def temp_storage():
    temp_dir = tempfile.mkdtemp()
    storage = LocalStorage(base_dir=temp_dir)
    yield storage
    shutil.rmtree(temp_dir, ignore_errors=True)


def test_storage_put_and_get(temp_storage):
    key = "resumes/test_candidate.pdf"
    content = b"%PDF-1.4 sample pdf content for unit testing"
    
    stored_key = temp_storage.put(key, content, content_type="application/pdf")
    assert stored_key == key
    assert temp_storage.exists(key) is True

    # Read back stream
    with temp_storage.get(key) as f:
        read_content = f.read()
        assert read_content == content


def test_storage_delete(temp_storage):
    key = "photos/profile.png"
    content = b"fake-png-bytes"
    
    temp_storage.put(key, content)
    assert temp_storage.exists(key) is True
    
    deleted = temp_storage.delete(key)
    assert deleted is True
    assert temp_storage.exists(key) is False


def test_storage_not_found(temp_storage):
    with pytest.raises(FileNotFoundError):
        temp_storage.get("resumes/non_existent.pdf")
