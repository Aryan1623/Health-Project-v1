from fastapi import APIRouter
from pydantic import BaseModel, EmailStr
from emailer import send_welcome_email

router = APIRouter(prefix="/auth")

# temporary in-memory store (replace with DB later)
USERS = {}

class SignupRequest(BaseModel):
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/signup")
def signup(data: SignupRequest):
    if data.email in USERS:
        return {"error": "User already exists"}

    USERS[data.email] = data.password

    send_welcome_email(data.email)

    return {"message": "Signup successful"}

@router.post("/login")
def login(data: LoginRequest):
    if USERS.get(data.email) != data.password:
        return {"error": "Invalid credentials"}

    return {"message": "Login successful"}
