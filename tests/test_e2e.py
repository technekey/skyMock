import httpx
import pytest
import asyncio
from datetime import date, datetime
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

def test_generate_industry_fields(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    httpx.post(f"{BASE_URL}/admin/generate-mock?count=1", headers=headers)
    resp = httpx.get(f"{BASE_URL}/bookings?travel_date={date.today().isoformat()}", headers=headers)
    assert resp.status_code == 200
    booking = resp.json()[0]
    
    # Check new industry fields
    assert "flight_number" in booking
    assert "cabin_class" in booking
    assert "seat_number" in booking
    assert "ticket_price" in booking
    assert "passenger_email" in booking
    assert "terminal" in booking
    assert "gate" in booking

def test_auth_toggle_flow(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    # Disable Auth
    httpx.post(f"{BASE_URL}/admin/toggle-auth", json={"enabled": False}, headers=headers)
    assert httpx.get(f"{BASE_URL}/bookings?travel_date={date.today().isoformat()}").status_code == 200
    # Enable Auth
    httpx.post(f"{BASE_URL}/admin/toggle-auth", json={"enabled": True}, headers=headers)
    assert httpx.get(f"{BASE_URL}/bookings?travel_date={date.today().isoformat()}").status_code == 401

@pytest.mark.asyncio
async def test_industry_stream(auth_token):
    async with httpx.AsyncClient(timeout=30.0) as client:
        async with client.stream("GET", f"{BASE_URL}/admin/bookings-stream?token={auth_token}") as response:
            payload = {
                "passenger_name": "Industry Test", "passenger_email": "test@airline.com", "passenger_phone": "123",
                "source": "LHR", "destination": "JFK", "travel_date": date.today().isoformat(),
                "cabin_class": "Business", "meal_preference": "Veg", "luggage_kg": 30, "services": []
            }
            await asyncio.sleep(1.0)
            await client.post(f"{BASE_URL}/book", json=payload)
            async for chunk in response.aiter_lines():
                if chunk.startswith("data: "):
                    data = json.loads(chunk[6:])
                    assert data["cabin_class"] == "Business"
                    assert "flight_number" in data
                    return
