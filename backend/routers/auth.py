from fastapi import APIRouter, Depends, HTTPException, status, Body
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timedelta
from typing import Optional
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from bson import ObjectId

from database import get_database
from models.user import UserCreate, UserInDB, UserResponse, PlanType, SubscriptionStatus, UsageStats
from utils.auth import get_password_hash, verify_password, create_access_token, get_current_user_email
from jose import jwt, JWTError
from config import settings
from shared.response import success_response

router = APIRouter()

async def get_user_by_email(db: AsyncIOMotorDatabase, email: str):
    user = await db.users.find_one({"email": email})
    return user

@router.post("/signup", response_model=UserResponse)
async def signup(user_data: UserCreate, db: AsyncIOMotorDatabase = Depends(get_database)):
    existing_user = await get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_data.password) if user_data.password else None
    
    user_dict = {
        "email": user_data.email,
        "name": user_data.name,
        "profile_picture": user_data.profile_picture,
        "hashed_password": hashed_password,
        "subscription_plan": PlanType.FREE,
        "subscription_status": SubscriptionStatus.NONE,
        "usage": UsageStats().dict(),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_dict)
    user_dict["_id"] = str(result.inserted_id)
    
    return success_response(user_dict)

@router.post("/login")
async def login(email: str = Body(...), password: str = Body(...), db: AsyncIOMotorDatabase = Depends(get_database)):
    user = await get_user_by_email(db, email)
    if not user or not user.get("hashed_password") or not verify_password(password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(data={"sub": user["email"]})
    return success_response({"access_token": access_token, "token_type": "bearer"})

from pydantic import BaseModel

class GoogleAuthRequest(BaseModel):
    token: str

@router.post("/google")
async def google_auth(request: GoogleAuthRequest, db: AsyncIOMotorDatabase = Depends(get_database)):
    token = request.token
    try:
        # Verify Google ID Token
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), settings.google_client_id)
        
        email = idinfo['email']
        name = idinfo.get('name', '')
        picture = idinfo.get('picture', '')
        google_id = idinfo['sub']
        
        user = await get_user_by_email(db, email)
        
        if not user:
            # Auto-signup
            user_dict = {
                "email": email,
                "name": name,
                "profile_picture": picture,
                "google_id": google_id,
                "subscription_plan": PlanType.FREE,
                "subscription_status": SubscriptionStatus.NONE,
                "usage": UsageStats().dict(),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            result = await db.users.insert_one(user_dict)
            user = user_dict
            user["_id"] = str(result.inserted_id)
        else:
            # Update google_id if not present
            if not user.get("google_id"):
                await db.users.update_one({"_id": user["_id"]}, {"$set": {"google_id": google_id, "profile_picture": picture}})
        
        access_token = create_access_token(data={"sub": email})
        return success_response({"access_token": access_token, "token_type": "bearer"})
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Google token")

@router.get("/me")
async def get_me(email: str = Depends(get_current_user_email), db: AsyncIOMotorDatabase = Depends(get_database)):
    user = await get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Convert _id to id string for response
    user["id"] = str(user["_id"])
    return success_response(user)

@router.post("/forgot-password")
async def forgot_password(email: str = Body(...), db: AsyncIOMotorDatabase = Depends(get_database)):
    user = await get_user_by_email(db, email)
    if not user:
        # Don't reveal if user exists for security
        return success_response({"message": "If the account exists, a reset link has been sent."})
    
    # Generate a simple reset token (in production use a signed token or random secret stored in DB)
    reset_token = create_access_token(data={"sub": email, "purpose": "reset_password"}, expires_delta=timedelta(hours=1))
    
    # Log the token since we don't have SMTP yet
    print(f"PASSWORD RESET REQUEST FOR {email}: Token is {reset_token}")
    
    return success_response({"message": "If the account exists, a reset link has been sent."})

@router.post("/reset-password")
async def reset_password(token: str = Body(...), new_password: str = Body(...), db: AsyncIOMotorDatabase = Depends(get_database)):
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        email = payload.get("sub")
        purpose = payload.get("purpose")
        
        if email is None or purpose != "reset_password":
            raise HTTPException(status_code=400, detail="Invalid token")
        
        user = await get_user_by_email(db, email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        hashed_password = get_password_hash(new_password)
        await db.users.update_one({"_id": user["_id"]}, {"$set": {"hashed_password": hashed_password, "updated_at": datetime.utcnow()}})
        
        return success_response({"message": "Password updated successfully"})
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
