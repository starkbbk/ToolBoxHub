from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum

class PlanType(str, Enum):
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"

class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELLED = "cancelled"
    NONE = "none"

class UsageStats(BaseModel):
    pdf_conversions: int = 0
    text_removals: int = 0
    image_compressions: int = 0
    last_reset: datetime = Field(default_factory=datetime.utcnow)

class UserBase(BaseModel):
    email: EmailStr
    name: str
    profile_picture: Optional[str] = None

class UserCreate(UserBase):
    password: Optional[str] = None # Optional because of Google OAuth

class UserUpdate(BaseModel):
    name: Optional[str] = None
    profile_picture: Optional[str] = None
    password: Optional[str] = None

class UserInDB(UserBase):
    id: str = Field(alias="_id")
    hashed_password: Optional[str] = None
    google_id: Optional[str] = None
    subscription_plan: PlanType = PlanType.FREE
    subscription_status: SubscriptionStatus = SubscriptionStatus.NONE
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    usage: UsageStats = Field(default_factory=UsageStats)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserResponse(UserBase):
    id: str
    subscription_plan: PlanType
    subscription_status: SubscriptionStatus
    usage: UsageStats
    created_at: datetime
