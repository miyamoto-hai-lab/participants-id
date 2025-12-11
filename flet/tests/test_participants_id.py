from unittest.mock import AsyncMock, MagicMock

import pytest
from participants_id import Participant

import flet as ft


@pytest.fixture
def mock_page():
    page = MagicMock(spec=ft.Page)
    page.client_storage = AsyncMock()
    # Setup client_storage mocks
    storage = {}
    
    async def get_value(key):
        return storage.get(key)
        
    async def set_value(key, value):
        storage[key] = value
        return True
        
    async def remove_value(key):
        if key in storage:
            del storage[key]
            return True
        return False # Or True? Implementation returns result of remove.
        
    page.client_storage.get.side_effect = get_value
    page.client_storage.set.side_effect = set_value
    page.client_storage.remove.side_effect = remove_value
    
    return page

@pytest.mark.asyncio
async def test_browser_id_generation(mock_page):
    def browser_id_validation_func1(uuid):
        return False
    
    async def browser_id_validation_func2(uuid):
        return True

    participant = Participant(mock_page, app_name="test_app", browser_id_validation_func=browser_id_validation_func1)
    
    # First access should generate ID
    id1 = await participant.browser_id
    assert id1 is None
    participant.browser_id_validation_func = browser_id_validation_func2
    id1 = await participant.browser_id
    assert id1 is not None
    assert isinstance(id1, str)
    assert len(id1) > 0
    # assert await participant.created_at is not None
    # assert await participant.updated_at is None
    # await participant._generate_browser_id()
    # assert await participant.updated_at is not None
    
    # Check if saved to storage
    # Key should be "participants_id.browser_id"
    assert await mock_page.client_storage.get("participants_id.browser_id") == id1

@pytest.mark.asyncio
async def test_browser_id_persistence(mock_page):
    participant = Participant(mock_page, app_name="test_app")
    
    id1 = await participant.browser_id
    id2 = await participant.browser_id
    
    assert id1 == id2

@pytest.mark.asyncio
async def test_delete_browser_id(mock_page):
    participant = Participant(mock_page, app_name="test_app")
    
    id1 = await participant.browser_id
    await participant._delete_browser_id()
    
    # Should be gone from storage
    assert await mock_page.client_storage.get("participants_id.browser_id") is None
    
    # Next access should generate new ID
    id2 = await participant.browser_id
    assert id2 != id1

@pytest.mark.asyncio
async def test_attributes(mock_page):
    participant = Participant(mock_page, app_name="test_app")
    
    await participant.set_attribute("attr1", "value1")
    val = await participant.get_attribute("attr1")
    assert val == "value1"
    
    # Check storage key: "participants_id.test_app.attr1"
    assert await mock_page.client_storage.get("participants_id.test_app.attr1") == "value1"

@pytest.mark.asyncio
async def test_attribute_types(mock_page):
    participant = Participant(mock_page, app_name="test_app")
    
    await participant.set_attribute("int_val", 123)
    assert await participant.get_attribute("int_val") == 123
    
    await participant.set_attribute("bool_val", True)
    assert await participant.get_attribute("bool_val") is True
    
    await participant.set_attribute("list_val", ["a", "b"])
    assert await participant.get_attribute("list_val") == ["a", "b"]

@pytest.mark.asyncio
async def test_delete_attribute(mock_page):
    participant = Participant(mock_page, app_name="test_app")
    
    await participant.set_attribute("to_delete", "val")
    await participant.delete_attribute("to_delete")
    
    assert await participant.get_attribute("to_delete") is None

@pytest.mark.asyncio
async def test_custom_prefix(mock_page):
    participant = Participant(mock_page, app_name="test_app", prefix="custom")
    
    await participant.browser_id
    assert await mock_page.client_storage.get("custom.browser_id") is not None
    
    await participant.set_attribute("attr", "val")
    assert await mock_page.client_storage.get("custom.test_app.attr") == "val"
