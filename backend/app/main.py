import asyncio
import json
import random
import uuid
from datetime import datetime, date, timedelta
from typing import List, Optional, AsyncGenerator

from fastapi import FastAPI, HTTPException, Request, Depends, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from faker import Faker
from sqlmodel import Field, Session, SQLModel, create_engine, select
from passlib.context import CryptContext
from jose import JWTError, jwt
from pydantic import BaseModel

# --- CONFIG & SECURITY ---
SECRET_KEY = "super-secret-key-for-mocking"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

class Settings:
    auth_enabled = True

settings = Settings()

# --- MODELS ---
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    hashed_password: str
    token_version: str = Field(default_factory=lambda: str(uuid.uuid4()))

class Booking(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    passenger_name: str
    passenger_email: str = Field(default="mock@example.com")
    passenger_phone: str = Field(default="+1-555-0199")
    loyalty_id: Optional[str] = None
    pnr: str
    flight_number: str = Field(default="SK101")
    source: str
    destination: str
    travel_date: date
    cabin_class: str = Field(default="Economy")
    seat_number: str = Field(default="12A")
    ticket_price: float = Field(default=299.99)
    currency: str = Field(default="USD")
    terminal: str = Field(default="T1")
    gate: str = Field(default="G12")
    meal_preference: str
    luggage_kg: int
    services: str
    is_cancellable: bool = Field(default=True)
    cancellation_window_hours: int = Field(default=24)
    check_in_status: bool = Field(default=False)
    booking_time: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class BookingCreate(SQLModel):
    passenger_name: str
    passenger_email: str
    passenger_phone: str
    source: str
    destination: str
    travel_date: date
    cabin_class: str
    meal_preference: str
    luggage_kg: int
    services: List[str]

class Token(SQLModel):
    access_token: str
    token_type: str

class PasswordChange(SQLModel):
    old_password: str
    new_password: str

class AuthToggle(BaseModel):
    enabled: bool

# --- PUB/SUB ---
booking_listeners: List[asyncio.Queue] = []

async def notify_listeners(booking_dict: dict):
    for q in booking_listeners:
        await q.put(booking_dict)

# --- DB SETUP ---
sqlite_url = "sqlite:///./bookings.db"
engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        statement = select(User).where(User.username == "admin")
        user = session.exec(statement).first()
        if not user:
            admin = User(username="admin", hashed_password=pwd_context.hash("admin"))
            session.add(admin)
            session.commit()

# --- UTILS ---
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)):
    if not settings.auth_enabled:
        return "guest"
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        version: str = payload.get("v")
        if username is None or version is None:
            raise HTTPException(status_code=401, detail="Invalid token structure")
        
        with Session(engine) as session:
            statement = select(User).where(User.username == username)
            user = session.exec(statement).first()
            if not user or user.token_version != version:
                raise HTTPException(status_code=401, detail="Token has been revoked or is invalid")
            return username
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# --- APP ---
app = FastAPI(title="Pro Airline Mock API")
fake = Faker()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# --- AUTH & SETTINGS ---
@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    with Session(engine) as session:
        statement = select(User).where(User.username == form_data.username)
        user = session.exec(statement).first()
        if not user or not pwd_context.verify(form_data.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Incorrect username or password")
        
        access_token = create_access_token(data={"sub": user.username, "v": user.token_version})
        return {"access_token": access_token, "token_type": "bearer"}

@app.post("/admin/rotate-token", response_model=Token)
async def rotate_token(current_user: str = Depends(get_current_user)):
    with Session(engine) as session:
        statement = select(User).where(User.username == "admin")
        user = session.exec(statement).one()
        user.token_version = str(uuid.uuid4())
        session.add(user)
        session.commit()
        session.refresh(user)
        
        access_token = create_access_token(data={"sub": user.username, "v": user.token_version})
        return {"access_token": access_token, "token_type": "bearer"}

@app.post("/admin/toggle-auth")
async def toggle_auth(data: AuthToggle, current_user: str = Depends(get_current_user)):
    settings.auth_enabled = data.enabled
    return {"status": "success", "auth_enabled": settings.auth_enabled}

@app.get("/admin/settings")
async def get_settings():
    return {"auth_enabled": settings.auth_enabled}

@app.post("/admin/change-password")
async def change_password(data: PasswordChange, current_user: str = Depends(get_current_user)):
    with Session(engine) as session:
        statement = select(User).where(User.username == "admin")
        user = session.exec(statement).one()
        if not pwd_context.verify(data.old_password, user.hashed_password):
            raise HTTPException(status_code=400, detail="Old password incorrect")
        user.hashed_password = pwd_context.hash(data.new_password)
        session.add(user)
        session.commit()
    return {"message": "Password updated successfully"}

# --- MOCK LOGIC ---
def generate_pnr():
    return "".join(random.choices("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", k=6))

@app.post("/admin/generate-mock")
async def generate_mock(
    count: int = 100, 
    target_date: date = date.today(),
    mode: str = "day",
    current_user: str = Depends(get_current_user)
):
    with Session(engine) as session:
        for _ in range(count):
            travel_date = target_date + timedelta(days=random.randint(0, 6)) if mode == "week" else target_date
            cabin = random.choice(["Economy", "Premium Economy", "Business", "First"])
            booking = Booking(
                passenger_name=fake.unique.name(),
                passenger_email=fake.email(),
                passenger_phone=fake.phone_number(),
                loyalty_id=f"FF{random.randint(100000, 999999)}",
                pnr=generate_pnr(),
                flight_number=f"{random.choice(['AA', 'BA', 'EK', 'QR'])}{random.randint(100, 999)}",
                source=fake.city(),
                destination=fake.city(),
                travel_date=travel_date,
                cabin_class=cabin,
                seat_number=f"{random.randint(1, 40)}{random.choice('ABCDEF')}",
                ticket_price=round(random.uniform(50, 2000), 2),
                currency=random.choice(["USD", "EUR", "GBP"]),
                terminal=random.choice(["T1", "T2", "T3", "Intl"]),
                gate=f"{random.choice('ABC')}{random.randint(1, 30)}",
                meal_preference=random.choice(["Veg", "Non-Veg", "Vegan", "Jain"]),
                luggage_kg=random.randint(7, 40),
                services=",".join(random.sample(["Priority Check-in", "Extra Legroom", "Lounge Access", "WiFi"], k=random.randint(0, 4))),
                is_cancellable=random.choice([True, True, False]),
                cancellation_window_hours=random.choice([12, 24, 48]),
                check_in_status=random.choice([True, False]),
                booking_time=datetime.utcnow() - timedelta(minutes=random.randint(1, 5000))
            )
            session.add(booking)
            await notify_listeners(booking.dict())
        session.commit()
    return {"message": f"Generated {count} mock bookings"}

# --- PUBLIC ENDPOINTS ---
@app.post("/book")
async def create_booking(booking_data: BookingCreate):
    booking = Booking(
        passenger_name=booking_data.passenger_name,
        passenger_email=booking_data.passenger_email,
        passenger_phone=booking_data.passenger_phone,
        pnr=generate_pnr(),
        flight_number=f"SKY{random.randint(100, 999)}",
        source=booking_data.source,
        destination=booking_data.destination,
        travel_date=booking_data.travel_date,
        cabin_class=booking_data.cabin_class,
        seat_number=f"{random.randint(1, 40)}{random.choice('ABCDEF')}",
        ticket_price=299.99,
        currency="USD",
        terminal="T1",
        gate="G12",
        meal_preference=booking_data.meal_preference,
        luggage_kg=booking_data.luggage_kg,
        services=",".join(booking_data.services),
        is_cancellable=True,
        cancellation_window_hours=24,
        check_in_status=False,
        booking_time=datetime.utcnow()
    )
    with Session(engine) as session:
        session.add(booking)
        session.commit()
        session.refresh(booking)
    await notify_listeners(booking.dict())
    return booking

@app.get("/bookings")
async def get_bookings(travel_date: date, token: Optional[str] = Depends(oauth2_scheme)):
    if settings.auth_enabled and not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    # Verify token version even for bookings
    if settings.auth_enabled:
        await get_current_user(token)
        
    with Session(engine) as session:
        statement = select(Booking).where(Booking.travel_date == travel_date)
        return session.exec(statement).all()

# --- SSE STREAM ---
@app.get("/admin/bookings-stream")
async def stream_bookings(request: Request, token: Optional[str] = Query(None)):
    if settings.auth_enabled:
        if not token:
            raise HTTPException(status_code=401, detail="Token required")
        # Reuse get_current_user logic to verify version
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            username: str = payload.get("sub")
            version: str = payload.get("v")
            with Session(engine) as session:
                statement = select(User).where(User.username == username)
                user = session.exec(statement).first()
                if not user or user.token_version != version:
                    raise HTTPException(status_code=401, detail="Invalid token version")
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid token")

    q = asyncio.Queue()
    booking_listeners.append(q)

    async def event_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    booking = await asyncio.wait_for(q.get(), timeout=2.0)
                    yield f"data: {json.dumps(booking, default=str)}\n\n"
                except asyncio.TimeoutError:
                    yield ": keep-alive\n\n"
        finally:
            booking_listeners.remove(q)
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
