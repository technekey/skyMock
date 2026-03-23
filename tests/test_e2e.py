import httpx
import pytest
import asyncio
from datetime import date
import json

BASE_URL = "http://localhost:8000"
FE_URL = "http://localhost:3021"

@pytest.fixture
def auth_token():
    response = httpx.post(f"{BASE_URL}/token", data={"username": "admin", "password": "admin"})
    assert response.status_code == 200
    return response.json()["access_token"]

def test_frontend_reachable():
    assert httpx.get(FE_URL).status_code == 200

def test_token_rotation(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # 1. Verify old token works
    resp = httpx.get(f"{BASE_URL}/bookings?travel_date={date.today().isoformat()}", headers=headers)
    assert resp.status_code == 200
    
    # 2. Rotate Token
    rotate_resp = httpx.post(f"{BASE_URL}/admin/rotate-token", headers=headers)
    assert rotate_resp.status_code == 200
    new_token = rotate_resp.json()["access_token"]
    assert new_token != auth_token
    
    # 3. Verify old token is now INVALID (401)
    invalid_resp = httpx.get(f"{BASE_URL}/bookings?travel_date={date.today().isoformat()}", headers=headers)
    assert invalid_resp.status_code == 401
    
    # 4. Verify new token WORKS
    new_headers = {"Authorization": f"Bearer {new_token}"}
    valid_resp = httpx.get(f"{BASE_URL}/bookings?travel_date={date.today().isoformat()}", headers=new_headers)
    assert valid_resp.status_code == 200

def test_auth_toggle_flow(auth_token):
    # Get a fresh token in case rotation test ran before this
    login_resp = httpx.post(f"{BASE_URL}/token", data={"username": "admin", "password": "admin"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Disable Auth
    httpx.post(f"{BASE_URL}/admin/toggle-auth", json={"enabled": False}, headers=headers)
    assert httpx.get(f"{BASE_URL}/bookings?travel_date={date.today().isoformat()}").status_code == 200
    # Enable Auth
    httpx.post(f"{BASE_URL}/admin/toggle-auth", json={"enabled": True}, headers=headers)
    assert httpx.get(f"{BASE_URL}/bookings?travel_date={date.today().isoformat()}").status_code == 401
